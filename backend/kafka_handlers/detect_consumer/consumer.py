import cv2
import numpy as np
from detectors import get_detector_by_type
from ..kafka_consumer import KafkaAvroConsumer
from ..kafka_producer import KafkaAvroProducer
from core.frame_processor import FrameProcessor
from dotenv import load_dotenv
import os

def convert_point(point_dict):
    if isinstance(point_dict, dict) and 'x' in point_dict and 'y' in point_dict:
        return (point_dict['x'], point_dict['y'])
    return point_dict

def convert_params(params):
    if not isinstance(params, dict):
        return params

    for key in ['roi', 'stop_line', 'light_roi']:
        if key in params and isinstance(params[key], list):
            params[key] = [convert_point(p) for p in params[key]]

    if 'lanes' in params and isinstance(params['lanes'], list):
        for lane in params['lanes']:
            if isinstance(lane, dict) and 'polygon' in lane and isinstance(lane['polygon'], list):
                lane['polygon'] = [convert_point(p) for p in lane['polygon']]

    return params

def from_dict(obj, ctx):
    if not isinstance(obj, dict):
        return obj

    if 'params' in obj:
        obj['params'] = convert_params(obj['params'])

    return obj


class DetectConsumer(KafkaAvroConsumer):
    def __init__(self, config, topics, schema_registry_url, subject, from_dict_func=from_dict):
        super().__init__(config, topics, schema_registry_url, subject, from_dict_func)
        self.producer = KafkaAvroProducer({'bootstrap.servers': config['bootstrap.servers']})

    def process_message(self, data: dict):
        try:
            session_id = data.get("session_id")
            frame_bytes = data.get("frame")
            params = data.get("params")

            if not (session_id and frame_bytes and params):
                print("Warning: Missing required fields")
                return

            np_arr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                print(f"Warning: Failed to decode frame for session {session_id}")
                return

            detection_type = params.get("detection_type")
            detector = get_detector_by_type(detection_type, params)
            processor = FrameProcessor(detector, params)
            processed_frame, _ = processor.process(frame)

            success, buffer = cv2.imencode(".jpg", processed_frame)
            if not success:
                print(f"Warning: Failed to encode processed frame for session {session_id}")
                return
            encoded_frame = buffer.tobytes()
            result = {
                "session_id": session_id,
                "processed_frame": encoded_frame
            }

            self.producer.publish(result, topic="frames-out", key=session_id)
            print(f"Processed frame for session {session_id} with detector {detection_type}")

        except Exception as e:
            print(f"Error processing message: {e}")

def main():
    print("🟢 Start Detect Consumer")

    load_dotenv()
    config = {
        "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_INTERNAL_SERVERS", "kafka:9092"),
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
