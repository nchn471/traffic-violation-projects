import os
import cv2
import tempfile
from dotenv import load_dotenv
from datetime import datetime
import traceback

from detectors import get_detector_by_type
from core.frame_processor import FrameProcessor
from storage.minio_manager import MinIOManager
from ...kafka_consumer import KafkaAvroConsumer
from ...kafka_producer import KafkaAvroProducer

def convert_point(point_dict):
    if isinstance(point_dict, dict) and 'x' in point_dict and 'y' in point_dict:
        return (point_dict['x'], point_dict['y'])
    return point_dict

def convert_config(config):
    if not isinstance(config, dict):
        return config

    for key in ['roi', 'stop_line', 'light_roi']:
        if key in config:
            config[key] = [convert_point(p) for p in config[key]]

    if 'lanes' in config:
        for lane in config['lanes']:
            lane['polygon'] = [convert_point(p) for p in lane['polygon']]

    return config

def from_dict(obj, ctx):
    if isinstance(obj, dict):
        obj = convert_config(obj)
    return obj


class DetectConsumer(KafkaAvroConsumer):
    def __init__(self, config, topics, schema_registry_url, subject):
        super().__init__(config, topics, schema_registry_url, subject, from_dict_func=from_dict)

        self.ws_producer = KafkaAvroProducer(
            config['bootstrap.servers'], schema_registry_url,
            "frames-out", "frames-out-value"
        )
        self.violation_producer = KafkaAvroProducer(
            config['bootstrap.servers'], schema_registry_url,
            "violations", "violations-value"
        )

        self.minio_client = MinIOManager()
        self.detector_cache = {}
        self.frame_counters = {}

    def process_message(self, data: dict):
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                session_id = data.get("session_id")
                camera_id = data.get("camera_id")
                frame_url = data.get("frame_url")
                video_url = data.get("video_url")
                video_name = os.path.basename(video_url) if video_url else None

                # Download and load frame
                frame_path = self.minio_client.get_file(frame_url, tmpdir)
                frame = cv2.imread(frame_path)

                # Extract frame_name from URL
                frame_name = os.path.basename(frame_url)

                # Get or create detector
                detection_type = data.get("detection_type")
                if session_id not in self.detector_cache:
                    self.detector_cache[session_id] = get_detector_by_type(detection_type, data)
                detector = self.detector_cache[session_id]

                # Process frame
                processor = FrameProcessor(detector, data['roi'])
                output = processor.process(frame)
                processed_frame = output.get("frame")
                violations = output.get("violations", [])

                # Upload processed frame
                tmp_proc_path = os.path.join(tmpdir, frame_name)
                cv2.imwrite(tmp_proc_path, processed_frame)
                minio_proc_path = f"frames-out/{camera_id}/{video_name}/{frame_name}"
                self.minio_client.upload_file(tmp_proc_path, minio_proc_path)


                self.ws_producer.publish({
                    "session_id": session_id,
                    "camera_id": camera_id,
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    "processed_frame_url": minio_proc_path
                }, key=session_id)

                # Publish violations
                for violation in violations:
                    self.violation_producer.publish(violation, key=session_id)

                # Flush producers
                self.ws_producer.producer.poll(0)
                self.violation_producer.producer.poll(0)

        except Exception as e:
            print(f"[ERROR] Failed to process message: {e}")
            traceback.print_exc()


# ------------------------- Entrypoint ------------------------

def main():
    print("Starting Detect Consumer...")

    load_dotenv()
    config = {
        "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
        "group.id": "detect-consumers",
        "auto.offset.reset": "latest",
    }

    topics = ["frames-in"]
    schema_registry_url = os.getenv("SCHEMA_REGISTRY_URL")
    subject = "frames-in-value"

    consumer = DetectConsumer(config, topics, schema_registry_url, subject)
    consumer.run()

if __name__ == "__main__":
    main()
