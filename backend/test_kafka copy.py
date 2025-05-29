from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'raw-frames',
    bootstrap_servers='localhost:9094',
    auto_offset_reset='earliest',
    enable_auto_commit=True,
    group_id='debug-group',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

print("Listening for messages on 'raw-frames'...")

for message in consumer:
    print(1)
