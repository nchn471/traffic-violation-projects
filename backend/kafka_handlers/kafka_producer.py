import os
import json
from confluent_kafka import Producer
from dotenv import load_dotenv

load_dotenv()

class KafkaProducer:
    def __init__(self, bootstrap_servers=None):
        self.bootstrap_servers = bootstrap_servers or os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
        self._producer = Producer({'bootstrap.servers': self.bootstrap_servers})

    def delivery_report(self, err, msg):
        if err is not None:
            print(f"[Kafka] Delivery failed: {err}")
        else:
            print(f"[Kafka] Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")

    def publish(self, data: dict, topic: str, key: str = None):
        try:
            value_bytes = json.dumps(data).encode('utf-8')
            key_bytes = key.encode('utf-8') if key else None

            print(f"[Kafka] Sending to topic: '{topic}' | key: {key}")
            self._producer.produce(topic=topic, key=key_bytes, value=value_bytes, callback=self.delivery_report)
            self._producer.poll(0)  # Xử lý callback ngay lập tức
        except Exception as e:
            print(f"[Kafka] Failed to send message: {e}")

    def flush(self):
        self._producer.flush()
