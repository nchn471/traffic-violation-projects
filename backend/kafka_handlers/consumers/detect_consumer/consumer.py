import os
import cv2
from dotenv import load_dotenv

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
    if isinstance(obj, dict) and 'config' in obj:
        obj['config'] = convert_config(obj['config'])
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
        
    def get_next_frame_index(self, session_id):
        self.frame_counters.setdefault(session_id, 0)
        self.frame_counters[session_id] += 1
        return self.frame_counters[session_id]

    def process_message(self, data: dict):
        try:
            session_id = data.get("session_id")
            camera_id = data.get("camera_id")
            frame_url = data.get("frame_url")
            timestamp = data.get("timestamp")
            config = data.get("config")

            if not all([session_id, camera_id, frame_url, config]):
                print("Missing required fields in message.")
                return

            # Load frame
            local_path = self.minio_client.get_file(frame_url)
            frame = cv2.imread(local_path)
            if frame is None:
                print(f"Failed to read frame from {local_path}")
                return

            frame_index = self.get_next_frame_index(session_id)

            # Get or create detector
            detection_type = config.get("detection_type", "default")
            if session_id not in self.detector_cache:
                self.detector_cache[session_id] = get_detector_by_type(detection_type, config)
            detector = self.detector_cache[session_id]

            # Process
            processor = FrameProcessor(detector, config)
            output = processor.process(frame)
            processed_frame = output.get("frame")
            violations = output.get("violations", [])

            # Save + upload processed frame
            tmp_proc = f"/tmp/{session_id}_frame_{frame_index}.jpg"
            cv2.imwrite(tmp_proc, processed_frame)
            minio_proc_path = f"frames-out/{camera_id}/{session_id}_frame_{frame_index}.jpg"
            self.minio_client.upload_file(tmp_proc, minio_proc_path)
            os.remove(tmp_proc)

            # Publish FrameOut
            self.ws_producer.publish({
                "session_id": session_id,
                "camera_id": camera_id,
                "timestamp": timestamp,
                "processed_frame_url": minio_proc_path
            }, key=session_id)

            # Publish Violations
            for idx, v in enumerate(violations):
                violation_id = f"{session_id}_f{frame_index}_v{idx}"
                violation_type = v.get("violation_type", "")
                vehicle_type = v.get("vehicle_type", "")
                confidence = float(v.get("confidence", 0.0))

                violation_url = ""
                vehicle_url = ""

                # Violation frame
                if v.get("violation_frame") is not None:
                    tmp_vf = f"/tmp/violation_{violation_id}.jpg"
                    cv2.imwrite(tmp_vf, v["violation_frame"])
                    violation_url = f"violations/{session_id}/violation_{violation_id}.jpg"
                    self.minio_client.upload_file(tmp_vf, violation_url)
                    os.remove(tmp_vf)

                # Vehicle frame
                if v.get("vehicle_frame") is not None:
                    tmp_vh = f"/tmp/vehicle_{violation_id}.jpg"
                    cv2.imwrite(tmp_vh, v["vehicle_frame"])
                    vehicle_url = f"violations/{session_id}/vehicle_{violation_id}.jpg"
                    self.minio_client.upload_file(tmp_vh, vehicle_url)
                    os.remove(tmp_vh)

                self.violation_producer.publish({
                    "camera_id": camera_id,
                    "violation_type": violation_type,
                    "vehicle_type": vehicle_type,
                    "confidence": confidence,
                    "timestamp": str(timestamp),
                    "violation_frame_url": violation_url.encode(),
                    "vehicle_frame_url": vehicle_url.encode()
                }, key=session_id)

            # Flush all in one go
            self.ws_producer.producer.poll(0)
            self.violation_producer.producer.poll(0)

        except Exception as e:
            print(f"Error processing message: {e}")

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
