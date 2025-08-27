from confluent_kafka import DeserializingConsumer, KafkaError, KafkaException
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.serialization import StringDeserializer


def from_dict(obj, ctx):
    return obj


class KafkaAvroConsumer:
    def __init__(self, config, topics: list, schema_registry_url: str, schema_registry_subject: str, from_dict_func=from_dict):
        self._topics = topics

        self.schema_registry_client = SchemaRegistryClient({'url': schema_registry_url})

        schema_str = self.schema_registry_client.get_latest_version(schema_registry_subject).schema.schema_str

        avro_deserializer = AvroDeserializer(
            schema_registry_client=self.schema_registry_client,
            schema_str=schema_str,
            from_dict=from_dict_func
        )

        consumer_conf = {
            **config,
            'key.deserializer': StringDeserializer('utf_8'),
            'value.deserializer': avro_deserializer
        }

        self._consumer = DeserializingConsumer(consumer_conf)
        self._consumer.subscribe(topics)

    def get_consumer(self):
        return self._consumer
    
    def process_message(self, message: dict):
        """Override this method in subclasses to handle each consumed message."""
        raise NotImplementedError("Override the 'process_message' method in your subclass.")

    def run(self):
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
                    self.process_message(value)
                    self._consumer.commit(msg)

        except Exception as e:
            print(f"Error occurred: {e}")
        finally:
            self._consumer.close()
            print("Kafka consumer closed.")

