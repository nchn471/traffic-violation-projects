from confluent_kafka import Consumer, KafkaException, KafkaError
import time

def basic_consumer(bootstrap_servers, group_id, topic):
    conf = {
        'bootstrap.servers': bootstrap_servers,
        'group.id': group_id,
        'auto.offset.reset': 'earliest',
    }
    consumer = Consumer(conf)
    consumer.subscribe([topic])
    print(f"Subscribed to topic '{topic}', waiting for messages...")
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None: 
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print(f"End of partition reached {msg.topic()} [{msg.partition()}]")
                elif msg.error():
                    raise KafkaException(msg.error())
            else:
                print(f"Received message: {msg.value().decode('utf-8')}")
    finally:
        consumer.close()



if __name__ == "__main__":
    BOOTSTRAP_SERVERS = "kafka:9092"  # Thay đổi theo Kafka bạn dùng
    GROUP_ID = "detect-consumers"
    TOPIC = "frames-in"  # Thay bằng topic bạn muốn test
    basic_consumer(BOOTSTRAP_SERVERS, GROUP_ID, TOPIC)
