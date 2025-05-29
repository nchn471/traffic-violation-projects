from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import base64
import asyncio
import uuid
import json

from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import publish_message
from kafka import KafkaConsumer
from dotenv import load_dotenv
import os

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

consumer = KafkaConsumer(
    'processed-frames',
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    auto_offset_reset='latest',
    group_id="websocket-group",
    enable_auto_commit=True
)

ws_router = APIRouter()


params = {
    "video": "videos/La-Khê-Hà_Đông.mp4",
    "location": "Lê Duẩn, Nguyễn Thái Học",
    "roi": [(73, 718), (342, 330), (1061, 323), (1076, 331), (1019, 394), (1009, 453), (1026, 509), (1052, 572), (1096, 649), (1141, 717)],
    "stop_line": [(154, 566), (1066, 541)],
    "light_roi": [(650, 5), (700, 5), (700, 50), (650, 50)],
    "detection_type": "lane",
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

    minio_client = MinIOManager()
    video_path = minio_client.get_file(params['video'])
    cap = cv2.VideoCapture(video_path)

    session_id = str(uuid.uuid4())

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            _, buffer = cv2.imencode(".jpg", frame)
            encoded_frame = base64.b64encode(buffer).decode("utf-8")

            message = {
                "session_id": session_id,
                "frame": encoded_frame,
                "params": params
            }
            publish_message(data=message, topic="raw-frames", key=session_id)

            for msg in consumer:
                data = msg.value
                if data.get("session_id") == session_id:
                    await websocket.send_text(data["processed_frame"])  
                    break

            await asyncio.sleep(0.03)
            
    except WebSocketDisconnect:
        print("Client disconnected.")
    finally:
        cap.release()