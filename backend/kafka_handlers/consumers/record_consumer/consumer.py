import os
from datetime import datetime
from ...kafka_consumer import KafkaAvroConsumer
from ...utils import decode_frame
from dotenv import load_dotenv
from detectors import get_detector_by_type

class RecordConsumer(KafkaAvroConsumer):
    def __init__(self, config, topics, schema_registry_url, schema_registry_subject):
        super().__init__(config, topics, schema_registry_url, schema_registry_subject)
        self.violation_recorder = get_detector_by_type(det_type='record')

    def process_message(self, violation: dict):
        try:
            timestamp_str = violation.get("timestamp")
            timestamp = datetime.fromisoformat(timestamp_str)
            full_img = decode_frame(violation.get("violation_frame"))
            vehicle_img = decode_frame(violation.get("vehicle_frame"))

            if full_img is None or vehicle_img is None:
                print(f"[RecordConsumer] Violation skipped due to missing frames")
                return

            self.violation_recorder.save_violation_snapshot(
                full_img=full_img,
                vehicle_img=vehicle_img,
                vehicle_type=violation.get("vehicle_type"),
                violation_type=violation.get("violation_type"),
                location=violation.get("location"),
                confidence=violation.get("confidence"),
                timestamp=timestamp
            )

            print(f"[RecordConsumer] Saved violation")

        except Exception as e:
            print(f"[RecordConsumer] Error processing message: {e}")


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
