from confluent_kafka import SerializingProducer
from confluent_kafka.serialization import StringSerializer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer

def to_dict(obj, ctx):
    return obj  

class KafkaAvroProducer:
    def __init__(self, brokers: str, schema_registry_url: str, topic: str, schema_registry_subject: str, to_dict_func=to_dict):
        self.topic = topic
        schema_registry_conf = {'url': schema_registry_url}
        self.schema_registry_client = SchemaRegistryClient(schema_registry_conf)
        schema_str =  self.schema_registry_client.get_latest_version(schema_registry_subject).schema.schema_str
        avro_serializer = AvroSerializer(
            schema_str=schema_str,
            schema_registry_client=self.schema_registry_client,
            to_dict=to_dict_func,
            conf={
                'auto.register.schemas': False
            }
        )

        producer_conf = {
            'bootstrap.servers': brokers,
            'key.serializer': StringSerializer('utf_8'),  
            'value.serializer': avro_serializer
        }

        self.producer = SerializingProducer(producer_conf)

    def delivery_report(self, err, msg):
        if err is not None:
            print(f"[Kafka] Delivery failed: {err}")
        else:
            print(f"[Kafka] Delivered to {msg.topic()} [{msg.partition()}] @ offset {msg.offset()}")

    def publish(self, value: dict, key: str = None):
        self.producer.produce(
            topic=self.topic,
            key=key,
            value=value,
            on_delivery=self.delivery_report
        )
