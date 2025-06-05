from ...kafka_consumer import KafkaAvroConsumer
from confluent_kafka import KafkaError, KafkaException
from ...utils import decode_frame

class WebsocketConsumer(KafkaAvroConsumer):
    def __init__(self, config, topics, schema_registry_url, schema_registry_subject):
        super().__init__(config, topics, schema_registry_url, schema_registry_subject)

    async def process_message(self, data: dict, websocket, expected_session_id):
        try:
            session_id = data.get("session_id")
            frame_bytes = data.get("processed_frame")

            if not all([session_id, frame_bytes]):
                print("Warning: Missing required fields in message.")
                return

            if session_id != expected_session_id:
                return  

            frame = decode_frame(frame_bytes)
            if frame is None:
                print(f"Warning: Failed to decode frame for session {session_id}")
                return

            await websocket.send_text(frame) 

        except Exception as e:
            print(f"Error processing message: {e}")

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
                        await self.process_message(value, websocket, expected_session_id)
                    self._consumer.commit(msg)

        except Exception as e:
            print(f"Error occurred: {e}")
        finally:
            self._consumer.close()
            print("Kafka consumer closed.")
