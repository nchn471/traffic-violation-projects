import json
from confluent_kafka import Producer
from dotenv import load_dotenv
import os

def send_test_message():
    load_dotenv()
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_EXTERNAL_SERVERS", "kafka:9092")
    topic = "raw-frames"

    producer = Producer({'bootstrap.servers': bootstrap_servers})

    params = {
        "detection_type": "test",  
    }

    message = {
        "session_id": "test-session-123",
        "frame": "base64:",
        "params": params,
    }

    def delivery_report(err, msg):
        if err is not None:
            print(f"Delivery failed: {err}")
        else:
            print(f"Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")

    # Gửi message
    producer.produce(topic, value=json.dumps(message).encode('utf-8'), callback=delivery_report)
    producer.flush()

if __name__ == "__main__":
    send_test_message()
