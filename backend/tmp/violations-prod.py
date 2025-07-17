import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaAvroProducer

load_dotenv()

# ==== Config ====
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_EXTERNAL_SERVERS", "kafka:9092")
SCHEMA_REGISTRY_URL = "http://localhost:8081"
SCHEMA_SUBJECT = "violations-value"
TOPIC_NAME = "violations"

# ==== Kafka Producer ====
producer = KafkaAvroProducer(
    brokers=KAFKA_BOOTSTRAP_SERVERS,
    schema_registry_url=SCHEMA_REGISTRY_URL,
    topic=TOPIC_NAME,
    schema_registry_subject=SCHEMA_SUBJECT
)

# ==== Dummy Metadata ====
camera_id = "8be6d3c5-dc29-4377-853e-8f0df9cf163b"
violation_id = str(uuid.uuid4())
session_id = str(uuid.uuid4())
violation_type = "no_helmet"
vehicle_type = "motorbike"
confidence = 0.91
timestamp = int(datetime.now().timestamp() * 1000)  # timestamp-millis

frame_image_path = "violations/2025.05.27/02079954-93eb-49e4-b234-2373f4031a4b/frame.jpg"
vehicle_image_path = "violations/2025.05.27/02079954-93eb-49e4-b234-2373f4031a4b/vehicle.jpg"

# ==== Build message ====
message = {
    "violation_id": violation_id,
    "camera_id": camera_id,
    "session_id": session_id,
    "violation_type": violation_type,
    "vehicle_type": vehicle_type,
    "confidence": confidence,
    "timestamp": timestamp,
    "frame_img_url": frame_image_path,
    "vehicle_img_url":vehicle_image_path
}

# ==== Send to Kafka ====
producer.publish(message)
producer.producer.poll(0)
producer.producer.flush()

print("✅ Sent violation message to Kafka:", message)
