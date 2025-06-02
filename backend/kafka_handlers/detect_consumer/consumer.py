import base64
import cv2
import numpy as np
import os
import json
from dotenv import load_dotenv
from ..kafka_consumer import KafkaConsumer 
from ..kafka_producer import KafkaProducer  
from detectors import get_detector_by_type
from core.frame_processor import FrameProcessor


class DetectConsumer(KafkaConsumer):
    def __init__(self, config, topics):
        super().__init__(config, topics)
        self.producer = KafkaProducer({'bootstrap.servers': config["bootstrap.servers"]})

    def process_message(self, data):
        try:
            params = data.get("params")
            encoded_frame = data.get("frame")
            session_id = data.get("session_id")

            if not (params and encoded_frame and session_id):
                print("Warning: Missing one of required keys in data")
                return

            # Decode frame
            frame_data = base64.b64decode(encoded_frame)
            np_arr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                print(f"Warning: Failed to decode frame for session {session_id}")
                return

            detection_type = params.get("detection_type")
            detector = get_detector_by_type(detection_type, params)
            processor = FrameProcessor(detector, params)
            processed_frame = processor.process(frame)

            # Encode processed frame
            success, buffer = cv2.imencode(".jpg", processed_frame)
            if not success:
                print(f"Warning: Failed to encode processed frame for session {session_id}")
                return
            processed_encoded = base64.b64encode(buffer).decode("utf-8")

            result = {
                "session_id": session_id,
                "processed_frame": processed_encoded,
            }

            self.producer.publish(result, topic="frames-out", key=session_id)

            print(f"Processed frame for session {session_id} with detector {detection_type}")

        except Exception as e:
            print(f"Error in process_message: {e}")


def main():
    print("🟢 Start Detect Consumer")

    load_dotenv()
    config = {
        "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_EXTERNAL_SERVERS", "kafka:9092"),
        "group.id": "detect-consumers",
        "auto.offset.reset": "latest",
    }
    topics = ["frames-in"]
    consumer = DetectConsumer(config, topics)
    consumer.run()


if __name__ == "__main__":
    main()
