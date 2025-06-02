import json
from confluent_kafka import Consumer, KafkaException, KafkaError


class KafkaConsumer:
    def __init__(self, config, topics):
        self._consumer = Consumer(config)
        
        self._topics = topics
        self._consumer.subscribe(self._topics)
    
    def process_message(self, message: dict):
        """
        Override trong subclass để xử lý message.
        """
        raise NotImplementedError("Override process_message in subclass")
    
    def run(self):
        print(f"Starting consumer for topics: {self._topics}")
        try:
            while True:
                msg = self._consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                if msg.error():
                    # xử lý error đặc biệt nếu cần
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # end of partition event, không phải lỗi nghiêm trọng
                        continue
                    else:
                        print(f"Consumer error: {msg.error()}")
                        continue

                try:
                    value = json.loads(msg.value().decode('utf-8'))
                    self.process_message(value)
                    self._consumer.commit(msg)
                except json.JSONDecodeError as e:
                    print(f"Failed to decode JSON message: {e}")
                except Exception as e:
                    print(f"Failed to process message: {e}")

        except KeyboardInterrupt:
            print("Consumer interrupted by user.")
        except KafkaException as e:
            print(f"Kafka error: {e}")
        finally:
            self._consumer.close()
            print("Consumer closed.")
