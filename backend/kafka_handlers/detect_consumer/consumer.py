import base64
import cv2
import numpy as np
from ..kafka_consumer import BaseConsumer
from detectors import get_detector_by_type
from core.frame_processor import FrameProcessor
from dotenv import load_dotenv
import os
from kafka import KafkaConsumer, KafkaProducer
import json
class DetectConsumer(BaseConsumer):
    
    def process_message(self, data):
        
        try:
            
            params = data.get("params")
            encoded_frame = data.get("frame")
            session_id = data.get("session_id")

            frame_data = base64.b64decode(encoded_frame)
            np_arr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            detection_type = params.get("detection_type")
            detector = get_detector_by_type(detection_type, params)
            processor = FrameProcessor(detector, params)
            processed_frame = processor.process(frame)

            _, buffer = cv2.imencode(".jpg", processed_frame)
            processed_encoded = base64.b64encode(buffer).decode("utf-8")

            result = {
                "session_id": session_id,
                "processed_frame": processed_encoded,
            }

            self.producer.send("processed-frames", value=result)
            self.producer.flush()

            print(f"Processed frame for session {session_id} with detector {detection_type}")
        except Exception as e:
            print(f"Error in process_message: {e}")
        
if __name__ == "__main__":
    
    print("Start Detect Consumer XXX")

    load_dotenv()
    
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_INTERNAL_SERVERS", "kafka:9092")

    detector = DetectConsumer(
        topic="raw-frames",
        group_id="frame-detectors",
        bootstrap_servers=[KAFKA_BOOTSTRAP_SERVERS]
    )
    detector.run()

        