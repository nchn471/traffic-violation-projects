import json
from kafka import KafkaConsumer

class BaseConsumer:
    def __init__(self, topic, group_id, bootstrap_servers):
        
        self.topic = topic
        
        self.consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            group_id=group_id,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
        )
        
    def process_message(self, message):
        raise NotImplementedError("Implement in subclass")

    def run(self):
        print(f"Starting consumer for topic '{self.topic}'")
        for msg in self.consumer:
            self.process_message(msg.value)
