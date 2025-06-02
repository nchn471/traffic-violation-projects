import json
from confluent_kafka import Producer

class KafkaProducer:
    def __init__(self, config):
        self._producer = Producer(config)

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
            self._producer.poll(0)  
        except Exception as e:
            print(f"[Kafka] Failed to send message: {e}")

    def flush(self):
        self._producer.flush()
