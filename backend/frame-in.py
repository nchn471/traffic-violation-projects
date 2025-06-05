import cv2
import uuid
import os

from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaAvroProducer 

from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_EXTERNAL_SERVERS", "kafka:9092")
SCHEMA_REGISTRY_URL = "http://localhost:8081"
SCHEMA_SUBJECT = 'frames-in-value'

def convert_point_list(points):
    return [{"x": x, "y": y} for (x, y) in points]

def prepare_params(params):
    return {
        "video": params["video"],
        "location": params["location"],
        "roi": convert_point_list(params["roi"]),
        "stop_line": convert_point_list(params["stop_line"]),
        "light_roi": convert_point_list(params["light_roi"]),
        "detection_type": params["detection_type"],
        "lanes": [
            {
                "id": lane["id"],
                "polygon": convert_point_list(lane["polygon"]),
                "allow_labels": lane["allow_labels"]
            }
            for lane in params["lanes"]
        ]
    }

# === Kafka Avro Producer === #
def to_dict(obj, ctx):
    return obj  # data đã là dict đúng schema

producer = KafkaAvroProducer(
    brokers=KAFKA_BOOTSTRAP_SERVERS,
    schema_registry_url=SCHEMA_REGISTRY_URL,
    topic="frames-in",
    schema_registry_subject=SCHEMA_SUBJECT,
    to_dict_func=to_dict
)

# === Params chuẩn hóa === #
raw_params = {
    "video": "videos/La-Khê-Hà_Đông.mp4",
    "location": "Lê Duẩn, Nguyễn Thái Học",
    "roi": [(73, 718), (342, 330), (1061, 323), (1076, 331), (1019, 394), (1009, 453), (1026, 509), (1052, 572), (1096, 649), (1141, 717)],
    "stop_line": [(154, 566), (1066, 541)],
    "light_roi": [(650, 5), (700, 5), (700, 50), (650, 50)],
    "detection_type": "light",
    "lanes": [
        {
            "id": 1,
            "polygon": [(76, 717), (274, 417), (543, 422), (492, 719)],
            "allow_labels": ["car", "truck"]
        },
        {
            "id": 2,
            "polygon": [(492, 719), (543, 422), (758, 440), (790, 717)],
            "allow_labels": ["motorcycle", "bicycle"]
        },
        {
            "id": 3,
            "polygon": [(790, 717), (758, 440), (1009, 429), (1172, 719)],
            "allow_labels": ["car", "motorcycle", "truck", "bicycle"]
        }
    ]
}
prepared_params = prepare_params(raw_params)

# === MinIO & Streaming === #
MINIO_CONFIG = {
    "endpoint_url": 'localhost:9000',
    "aws_access_key_id": os.getenv('AWS_ACCESS_KEY_ID'),
    "aws_secret_access_key": os.getenv('AWS_SECRET_ACCESS_KEY'),
    "bucket": os.getenv("MINIO_BUCKET"),
}

minio_client = MinIOManager(MINIO_CONFIG)
video_path = minio_client.get_file(prepared_params['video'])
cap = cv2.VideoCapture(video_path)

session_id = str(uuid.uuid4())
i=0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    _, buffer = cv2.imencode(".jpg", frame)
    encoded_frame = buffer.tobytes() 
    message = {
        "session_id": session_id,
        "frame": encoded_frame,
        "timestamp" : str(datetime.now()),
        "params": prepared_params
    }
    i+=1
    producer.publish(value=message, key=session_id)
    producer.producer.poll(0)
    
producer.producer.flush()

print(f"Total Frame: {i}")