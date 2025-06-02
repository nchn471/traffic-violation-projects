import json
from confluent_kafka import Consumer, Producer, KafkaException


class MessageProducer:
    def __init__(self, bootstrap_servers: str):
        self._producer = Producer({'bootstrap.servers': bootstrap_servers})

    def delivery_report(self, err, msg):
        if err is not None:
            print(f"Delivery failed: {err}")
        else:
            print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    def send(self, topic: str, message: dict):
        value = json.dumps(message).encode('utf-8')
        self._producer.produce(topic, value=value, callback=self.delivery_report)
        self._producer.poll(0)

    def flush(self):
        self._producer.flush()


class KafkaConsumer:
    def __init__(self, topic: str, group_id: str, bootstrap_servers: str, producer: MessageProducer = None):
        self._topic = topic
        self._consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True,
        })
        self._consumer.subscribe([self._topic])
        self._producer = producer

    def process_message(self, message: dict):
        """
        Override in subclass to handle consumed messages.
        Use self._producer.send(...) to send messages if needed.
        """
        raise NotImplementedError("Override process_message in subclass")

    def run(self):
        print(f"Starting consumer for topic '{self._topic}'")
        try:
            while True:
                msg = self._consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    print(f"Consumer error: {msg.error()}")
                    continue

                try:
                    value = json.loads(msg.value().decode('utf-8'))
                    self.process_message(value)
                    if self._producer:
                        self._producer._producer.poll(0)
                except Exception as e:
                    print(f"Failed to process message: {e}")
        except KeyboardInterrupt:
            print("Consumer interrupted.")
        finally:
            self._consumer.close()
            if self._producer:
                self._producer.flush()
