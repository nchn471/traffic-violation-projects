import os
import cv2
import numpy as np
from dotenv import load_dotenv
from confluent_kafka import DeserializingConsumer, KafkaException, KafkaError
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.serialization import StringDeserializer

# Load biến môi trường
load_dotenv()
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_EXTERNAL_SERVERS")
SCHEMA_REGISTRY_URL = "http://localhost:8081"
TOPIC = "frames-out"
GROUP_ID = "ws-consumers"
SUBJECT = "frames-out-value"

def create_consumer():
    """Khởi tạo Kafka Consumer với Avro Deserializer."""
    schema_registry_client = SchemaRegistryClient({'url': SCHEMA_REGISTRY_URL})
    latest_schema = schema_registry_client.get_latest_version(SUBJECT).schema.schema_str

    avro_deserializer = AvroDeserializer(
        schema_registry_client,
        latest_schema,
    )

    consumer_conf = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': GROUP_ID,
        'auto.offset.reset': 'latest',
        'key.deserializer': StringDeserializer('utf_8'),
        'value.deserializer': avro_deserializer,
    }

    consumer = DeserializingConsumer(consumer_conf)
    consumer.subscribe([TOPIC])
    return consumer

def display_frame(frame):
    """Hiển thị frame với OpenCV."""
    cv2.imshow('Processed Frame', frame)
    key = cv2.waitKey(1)
    return key == 27 or key == ord('q')  # ESC hoặc Q để thoát

def main():
    print("🎥 Kafka Avro Consumer Started - Waiting for frames...")
    consumer = create_consumer()

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print(f"📭 End of partition: {msg.topic()} [{msg.partition()}]")
                else:
                    raise KafkaException(msg.error())
                continue

            data = msg.value()
            if not data:
                print("⚠️ Received null or invalid message")
                continue

            processed_bytes = data.get("processed_frame")
            if not processed_bytes:
                print("⚠️ Missing 'processed_frame' in message")
                continue

            np_arr = np.frombuffer(processed_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if frame is not None:
                print(f"✅ Frame received | session_id: {data.get('session_id')}")
                if display_frame(frame):
                    print("🛑 Exit requested by user")
                    break
            else:
                print("❌ Failed to decode frame")

    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")

    finally:
        print("🔁 Closing consumer...")
        consumer.close()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
