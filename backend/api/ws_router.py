from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import asyncio
import uuid
import os
from datetime import datetime
from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaAvroProducer
from kafka_handlers.consumers.ws_consumer.consumer import WebsocketConsumer
from kafka_handlers.utils import encode_frame
from dotenv import load_dotenv

load_dotenv()

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

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
SCHEMA_REGISTRY_URL = os.getenv("SCHEMA_REGISTRY_URL")

producer = KafkaAvroProducer(
    brokers=KAFKA_BOOTSTRAP_SERVERS,
    schema_registry_url=SCHEMA_REGISTRY_URL,
    topic=["frames-in"],
    schema_registry_subject="frames-in-value"
)

consumer_conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'group.id': 'ws-consumers',
    'auto.offset.reset': 'latest',
}

consumer = WebsocketConsumer(
    config=consumer_conf,
    topics=["frames-out"],
    schema_registry_url=SCHEMA_REGISTRY_URL,
    schema_registry_subject="frames-out-value"
)

ws_router = APIRouter()

params = {
    "video": "videos/La-Khê-Hà_Đông.mp4",
    "location": "Lê Duẩn, Nguyễn Thái Học",
    "roi": [(73, 718), (342, 330), (1061, 323), (1076, 331), (1019, 394), (1009, 453), (1026, 509), (1052, 572), (1096, 649), (1141, 717)],
    "stop_line": [(154, 566), (1066, 541)],
    "light_roi": [(650, 5), (700, 5), (700, 50), (650, 50)],
    "detection_type": "lp",
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


@ws_router.websocket("/ws/camera")
async def video_websocket(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())

    minio_client = MinIOManager()
    video_path = minio_client.get_file(params["video"])
    cap = cv2.VideoCapture(video_path)

    async def send_frames():
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            message = {
                "session_id": session_id,
                "frame": encode_frame(frame),
                "timestamp": str(datetime.now()),
                "params": prepare_params(params)
            }

            producer.publish(value=message, key=session_id)
            await asyncio.sleep(0.03) 
            
    try:
        await asyncio.gather(send_frames(), consumer.run(websocket,session_id))
    except WebSocketDisconnect:
        print("Client disconnected.")
    finally:
        cap.release()

