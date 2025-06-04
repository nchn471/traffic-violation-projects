from confluent_kafka import DeserializingConsumer, KafkaException, KafkaError
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.serialization import StringDeserializer
import os
from dotenv import load_dotenv
import cv2
import numpy as np

load_dotenv()
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_EXTERNAL_SERVERS")
SCHEMA_REGISTRY_URL = os.getenv("SCHEMA_REGISTRY_URL")  # cần config đúng

TOPIC = "frames-out"
GROUP_ID = "ws-consumers"



def main():
    schema_registry_client = SchemaRegistryClient({'url': SCHEMA_REGISTRY_URL})
    subject = "frame-out"
    schema_str = schema_registry_client.get_latest_version(subject).schema.schema_str
    avro_deserializer = AvroDeserializer(
        schema_registry_client,
        schema_str,
        conf={
            'auto.register.schemas': False
        }
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

    print("Kafka Avro consumer started, waiting for frames...")

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print(f"End of partition reached {msg.topic()} [{msg.partition()}]")
                else:
                    raise KafkaException(msg.error())
            else:
                data = msg.value()  # dict với keys: session_id, processed_frame (bytes)

                if data is None:
                    print("Received null message")
                    continue

                processed_frame_bytes = data.get("processed_frame")
                if not processed_frame_bytes:
                    print("Missing processed_frame in message")
                    continue

                np_arr = np.frombuffer(processed_frame_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is not None:
                    print(f"Received frame session_id={data.get('session_id')}")
                    cv2.imshow('Processed Frame', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                else:
                    print("Frame decode error.")

    except KeyboardInterrupt:
        print("Consumer interrupted by user")

    finally:
        consumer.close()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
