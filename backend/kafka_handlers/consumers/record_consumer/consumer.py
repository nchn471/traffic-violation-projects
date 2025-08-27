import os
from ...kafka_consumer import KafkaAvroConsumer
from dotenv import load_dotenv
from detectors import get_detector_by_type

class RecordConsumer(KafkaAvroConsumer):
    def __init__(self, config, topics, schema_registry_url, schema_registry_subject):
        super().__init__(config, topics, schema_registry_url, schema_registry_subject)
        self.violation_recorder = get_detector_by_type(det_type='record')

    def process_message(self, violation: dict):
        
        self.violation_recorder.save_violation_snapshot(violation)


def main():
    print("Starting Record Consumer")
    load_dotenv()

    config = {
        "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
        "group.id": "record-consumers",
        "auto.offset.reset": "latest",
    }
    topics = ["violations"]
    schema_registry_url = os.getenv("SCHEMA_REGISTRY_URL")
    subject = "violations-value"

    consumer = RecordConsumer(config, topics, schema_registry_url, subject)
    consumer.run()


if __name__ == "__main__":
    main()
