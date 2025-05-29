import os
import json
from kafka import KafkaProducer
from kafka.errors import KafkaError
from dotenv import load_dotenv

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    key_serializer=lambda k: k.encode("utf-8") if k else None,
)

def publish_message(data: dict, topic: str, key: str = None):
    
    try:
        print(f"[Kafka] ▶ Sending to topic: '{topic}' | key: {key}")
        future = producer.send(topic, key=key, value=data)
        result = future.get(timeout=10)
        print(f"[Kafka] ✔ Sent to partition {result.partition}, offset {result.offset}")
    except KafkaError as e:
        print(f"[Kafka] ❌ Failed to send message: {e}")
    finally:
        producer.flush()
