from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import base64
import asyncio
import uuid
import json
import os

from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaProducer  

from confluent_kafka import Consumer
from dotenv import load_dotenv

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

consumer_conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'group.id': 'ws_consumer',
    'auto.offset.reset': 'latest',
}
consumer = Consumer(consumer_conf)
consumer.subscribe(['frames-out'])

producer_conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'client.id': 'ws-producer',

}
producer = KafkaProducer(producer_conf)

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

            producer.publish(data=message, topic="frames-in", key=session_id)

            while True:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    print(f"Consumer error: {msg.error()}")
                    continue

                try:
                    data = json.loads(msg.value().decode("utf-8"))
                except Exception as e:
                    print(f"Failed to decode message: {e}")
                    continue

                if data.get("session_id") == session_id:
                    await websocket.send_text(data["frame"])
                    break

            await asyncio.sleep(0.03)

    except WebSocketDisconnect:
        print("Client disconnected.")
    finally:
        cap.release()
