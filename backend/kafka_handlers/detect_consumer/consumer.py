import base64
import cv2
import numpy as np
import os
import json
from dotenv import load_dotenv
from confluent_kafka import Producer
from ..kafka_consumer import KafkaConsumer  # đã dùng Confluent
from detectors import get_detector_by_type
from core.frame_processor import FrameProcessor


class DetectConsumer(KafkaConsumer):
    def __init__(self, topic, group_id, bootstrap_servers):
        super().__init__(topic, group_id, bootstrap_servers)

        self.producer = Producer({'bootstrap.servers': bootstrap_servers})

    def delivery_report(self, err, msg):
        if err is not None:
            print(f"[Kafka] ❌ Delivery failed: {err}")
        else:
            print(f"[Kafka] ✔ Message delivered to {msg.topic()} [{msg.partition()}]")

    def process_message(self, data):
        try:
            params = data.get("params")
            encoded_frame = data.get("frame")
            session_id = data.get("session_id")

            # frame_data = base64.b64decode(encoded_frame)
            # np_arr = np.frombuffer(frame_data, np.uint8)
            # frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            detection_type = params.get("detection_type")
            # detector = get_detector_by_type(detection_type, params)
            # processor = FrameProcessor(detector, params)
            # processed_frame = processor.process(frame)

            # _, buffer = cv2.imencode(".jpg", processed_frame)
            # processed_encoded = base64.b64encode(buffer).decode("utf-8")

            # result = {
            #     "session_id": session_id,
            #     "processed_frame": processed_encoded,
            # }

            # self.producer.produce(
            #     topic="processed-frames",
            #     value=json.dumps(result).encode('utf-8'),
            #     callback=self.delivery_report
            # )
            # self.producer.poll(0)  

            print(f"Processed frame for session {session_id} with detector {detection_type}")

        except Exception as e:
            print(f"Error in process_message: {e}")


def main():
    print("🟢 Start Detect Consumer")

    load_dotenv()
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_INTERNAL_SERVERS", "kafka:9092")
    try:
        consumer = DetectConsumer(
            topic="raw-frames",
            group_id="frame-detectors-test",
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS
        )
        consumer.run()
    except:
        print("Something went wrong")


if __name__ == "__main__":
    main()
