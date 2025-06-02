from confluent_kafka import Consumer, KafkaException, KafkaError
import sys

def basic_consumer(bootstrap_servers, group_id, topic):
    conf = {
        'bootstrap.servers': bootstrap_servers,
        'group.id': group_id,
        'auto.offset.reset': 'earliest',
    }

    consumer = Consumer(conf)

    try:
        consumer.subscribe([topic])
        print(f"Subscribed to topic '{topic}', waiting for messages...")

        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue  # Không có message, vòng lặp tiếp tục
            if msg.error():
                # Xử lý lỗi Kafka
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # Đến cuối partition, có thể bỏ qua
                    print(f"End of partition reached {msg.topic()} [{msg.partition()}]")
                else:
                    raise KafkaException(msg.error())
            else:
                # In message ra console
                print(f"Received message: {msg.value().decode('utf-8')}")

    except KeyboardInterrupt:
        print("Aborted by user")
    finally:
        consumer.close()


if __name__ == "__main__":
    BOOTSTRAP_SERVERS = "kafka:9092"  # Thay đổi theo Kafka bạn dùng
    GROUP_ID = "test-consumer-group"
    TOPIC = "raw-frames"  # Thay bằng topic bạn muốn test
    print("aaaaa")
    basic_consumer(BOOTSTRAP_SERVERS, GROUP_ID, TOPIC)
