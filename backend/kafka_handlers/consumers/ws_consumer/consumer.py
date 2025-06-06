from ...kafka_consumer import KafkaAvroConsumer
from confluent_kafka import KafkaError, KafkaException

class WebsocketConsumer(KafkaAvroConsumer):
    def __init__(self, config, topics, schema_registry_url, schema_registry_subject):
        super().__init__(config, topics, schema_registry_url, schema_registry_subject)
        
    async def run(self, websocket, expected_session_id):
        print(f"Starting Kafka Avro consumer on topics: {self._topics}")
        try:
            while True:
                msg = self._consumer.poll(1.0)
                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        print(f"End of partition {msg.topic()} [{msg.partition()}]")
                    else:
                        raise KafkaException(msg.error())
                else:
                    value = msg.value()
                    if value:
                        session_id = value.get("session_id")
                        frame_bytes = value.get("processed_frame")

                        if not all([session_id, frame_bytes]):
                            print("Warning: Missing required fields in message.")
                            continue 
                        
                        if session_id != expected_session_id:
                            continue 

                        await websocket.send_bytes(frame_bytes)

                    self._consumer.commit(msg)

        except Exception as e:
            print(f"Error occurred: {e}")

        finally:
            self._consumer.close()
            print("Kafka consumer closed.")

