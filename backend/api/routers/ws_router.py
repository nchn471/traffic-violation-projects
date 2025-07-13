from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import asyncio
import uuid
import os
from datetime import datetime
from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaAvroProducer
from kafka_handlers.kafka_consumer import KafkaAvroConsumer
from kafka_handlers.utils import encode_frame, prepare_params
from dotenv import load_dotenv
from confluent_kafka import KafkaError, KafkaException

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
SCHEMA_REGISTRY_URL = os.getenv("SCHEMA_REGISTRY_URL")

producer = KafkaAvroProducer(
    brokers=KAFKA_BOOTSTRAP_SERVERS,
    schema_registry_url=SCHEMA_REGISTRY_URL,
    topic="frames-in",
    schema_registry_subject="frames-in-value"
)

consumer_conf = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'group.id': 'ws-consumers',
    'auto.offset.reset': 'latest',
}

consumer = KafkaAvroConsumer(
    config=consumer_conf,
    topics=["frames-out"],
    schema_registry_url=SCHEMA_REGISTRY_URL,
    schema_registry_subject="frames-out-value"
).get_consumer()


ws_router = APIRouter(
    prefix="/api/v1/ws", 
    tags=["Websocket"],
    )

@ws_router.websocket("/camera")
async def video_websocket(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())

    try:
        first_message = await websocket.receive_json()
        params = first_message.get("params")
        if not params or "video" not in params:
            await websocket.send_text("Missing required 'params' or 'video'")
            await websocket.close()
            return
    except Exception as e:
        await websocket.send_text(f"Error receiving params: {e}")
        await websocket.close()
        return

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
            producer.producer.poll(0)
            await asyncio.sleep(0.03)
        print("send_frames done")

    async def receive_frames():
        print("start receiving frames")
        while True:
            msg = await asyncio.to_thread(consumer.poll, 1.0)
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
                    msg_session_id = value.get("session_id")
                    frame_bytes = value.get("processed_frame")
                    if not all([msg_session_id, frame_bytes]):
                        print("Warning: Missing required fields in message.")
                        continue

                    if msg_session_id != session_id:
                        continue

                    await websocket.send_bytes(frame_bytes)
                    print(f"{msg_session_id} - Sent Bytes")
                await asyncio.to_thread(consumer.commit, msg)

    send_task = asyncio.create_task(send_frames())
    receive_task = asyncio.create_task(receive_frames())

    try:
        done, pending = await asyncio.wait(
            [send_task, receive_task],
            return_when=asyncio.FIRST_EXCEPTION
        )

        for task in pending:
            if not task.done():
                await task

    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        print(f"Unhandled exception: {e}")
    finally:
        cap.release()
        send_task.cancel()
        receive_task.cancel()
        print("WebSocket handler cleanup complete")