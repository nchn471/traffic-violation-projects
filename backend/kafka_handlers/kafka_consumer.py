import json
from confluent_kafka import Consumer, KafkaException


class BaseConsumer:
    def __init__(self, topic, group_id, bootstrap_servers):
        self.topic = topic

        self.consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True,
        })

        self.consumer.subscribe([self.topic])

    def process_message(self, message: dict):
        raise NotImplementedError("Implement in subclass")

    def run(self):
        print(f"Starting consumer for topic '{self.topic}'")
        try:
            while True:
                msg = self.consumer.poll(1.0)  # timeout in seconds
                if msg is None:
                    continue
                if msg.error():
                    print(f"[Kafka] ❌ Consumer error: {msg.error()}")
                    continue

                try:
                    value = json.loads(msg.value().decode("utf-8"))
                    self.process_message(value)
                except Exception as e:
                    print(f"[Kafka] ❌ Failed to process message: {e}")

        except KeyboardInterrupt:
            print("Consumer interrupted.")
        finally:
            self.consumer.close()
