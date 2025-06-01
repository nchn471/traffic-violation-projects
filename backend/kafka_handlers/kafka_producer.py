import os
import json
from confluent_kafka import Producer
from dotenv import load_dotenv

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

producer_conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
}

producer = Producer(producer_conf)

def delivery_report(err, msg):
    if err is not None:
        print(f"[Kafka] ❌ Delivery failed: {err}")
    else:
        print(f"[Kafka] ✔ Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")

def publish_message(data: dict, topic: str, key: str = None):
    try:
        value_bytes = json.dumps(data).encode('utf-8')
        key_bytes = key.encode('utf-8') if key else None

        print(f"[Kafka] ▶ Sending to topic: '{topic}' | key: {key}")
        producer.produce(topic=topic, key=key_bytes, value=value_bytes, callback=delivery_report)
        producer.poll(0)  # Trigger delivery report callbacks

    except Exception as e:
        print(f"[Kafka] ❌ Failed to send message: {e}")
    finally:
        producer.flush()
