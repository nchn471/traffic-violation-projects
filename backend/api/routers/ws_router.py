from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import cv2
import asyncio
import uuid
import os
from datetime import datetime
from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaAvroProducer
from kafka_handlers.kafka_consumer import KafkaAvroConsumer
from dotenv import load_dotenv
from confluent_kafka import KafkaError, KafkaException
from ..utils.ws import save_frame_to_minio, resize_frame
from storage.database import get_db
from storage.models.camera import Camera
import random
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
    'group.id': f'ws-consumers-{random.randint(1000, 9999)}',
    'auto.offset.reset': 'latest',
}

consumer = KafkaAvroConsumer(
    config=consumer_conf,
    topics=["frames-out"],
    schema_registry_url=SCHEMA_REGISTRY_URL,
    schema_registry_subject="frames-out-value"
).get_consumer()

ws_router = APIRouter(
    prefix="/ws", 
    tags=["Websocket"],
)

# @ws_router.websocket("/camera/{camera_id}")
# async def video_websocket(websocket: WebSocket, camera_id: str):
#     await websocket.accept()

#     db = next(get_db())
#     camera_obj = db.get(Camera, camera_id)

#     if not camera_obj or not camera_obj.config or not camera_obj.config.get("video_url"):
#         await websocket.send_json({"error": "Camera not found or missing video_url"})
#         await websocket.close(code=1003)
#         return

#     minio_client = MinIOManager()
#     video_path = minio_client.get_file(camera_obj.config["video_url"])
#     cap = cv2.VideoCapture(video_path)
#     session_id = str(uuid.uuid4())

            
#     async def send_frames():
#         frame_skip = 3
#         i = 0
#         sent = 0
#         while cap.isOpened():
#             ret, frame = cap.read()
#             if sent >= 500:
#                 print("Stop: Enough frames sent for testing.")
#                 break

#             if not ret:
#                 break

#             if i % frame_skip == 0:
#                 frame = resize_frame(frame)
#                 frame_url = save_frame_to_minio(frame, session_id, sent+1, minio_client)
#                 message = {
                
#                     "session_id": session_id,
#                     "camera_id" : camera_id,
#                     "frame_url": frame_url,
#                     "timestamp": int(datetime.now().timestamp() * 1000),
#                     **camera_obj.config
#                 }
#                 producer.publish(value=message, key=session_id)
#                 producer.producer.poll(0)
#                 sent += 1

#             i += 1
#         print(f"Sent: {sent}")
#         await websocket.send_json({"status": f"sending done {sent}"})

#     async def receive_frames():
#         print("Start receiving frames...")
#         while True:
#             msg = await asyncio.to_thread(consumer.poll, 1.0)
#             if msg is None:
#                 continue

#             if msg.error():
#                 if msg.error().code() == KafkaError._PARTITION_EOF:
#                     print(f"End of partition {msg.topic()} [{msg.partition()}]")
#                     continue
#                 else:
#                     raise KafkaException(msg.error())
#             else:
#                 value = msg.value()
#                 if value:
#                     msg_session_id = value.get("session_id")
#                     processed_url = value.get("processed_frame_url")
#                     if not msg_session_id or not processed_url:
#                         print("Warning: Missing fields in message.")
#                         continue

#                     if msg_session_id != session_id:
#                         continue
                    
#                     timestamp = value.get("timestamp")
#                     if isinstance(timestamp, datetime):
#                         timestamp = int(timestamp.timestamp() * 1000)
                        
#                     await websocket.send_json({
#                         "session_id": msg_session_id,
#                         "frame_url": processed_url,
#                         "timestamp": timestamp
#                     })
#                     print(f"{msg_session_id} - {processed_url}")
#                 await asyncio.to_thread(consumer.commit, msg)

#     send_task = asyncio.create_task(send_frames())
#     receive_task = asyncio.create_task(receive_frames())


#     try:
#         # await receive_task  
#         # Chờ cho cả 2 task kết thúc riêng biệt
#         done, pending = await asyncio.wait(
#             [send_task, receive_task],
#             return_when=asyncio.ALL_COMPLETED,  
#         )

#         # Dọn dẹp nếu cần
#         for task in pending:
#             task.cancel()

#     except WebSocketDisconnect:
#         print("Client disconnected.")
#     except Exception as e:
#         print(f"Unhandled exception: {e}")
#     finally:
#         cap.release()
#         send_task.cancel()
#         receive_task.cancel()
#         print("WebSocket handler cleanup complete")


@ws_router.websocket("/camera/{camera_id}")
async def camera_websocket(websocket: WebSocket, camera_id: str):
    await websocket.accept()

    db = next(get_db())
    camera_obj = db.get(Camera, camera_id)

    if not camera_obj:
        await websocket.send_json({"error": "Camera not found"})
        await websocket.close(code=1003)
        return

    print(f"Start receiving frames for camera {camera_id}...")

    try:
        while True:
            msg = await asyncio.to_thread(consumer.poll, 1.0)
            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    raise KafkaException(msg.error())

            value = msg.value()
            if not value:
                continue

            msg_camera_id = value.get("camera_id")
            processed_url = value.get("processed_frame_url")
            timestamp = value.get("timestamp")

            if msg_camera_id != str(camera_id) or not processed_url:
                print("Wrong Camera")
                continue

            if isinstance(timestamp, datetime):
                timestamp = int(timestamp.timestamp() * 1000)

            outputs = {
                "camera_id": msg_camera_id,
                "frame_url": processed_url,
                "timestamp": timestamp,
            }
            await websocket.send_json(outputs)
            print(f"Send frames {outputs['frame_url']}")
            await asyncio.to_thread(consumer.commit, msg)

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Unhandled exception: {e}")
    finally:
        print("WebSocket cleanup complete")


@ws_router.websocket("/video/{camera_id}")
async def video_websocket(websocket: WebSocket, camera_id: str):
    await websocket.accept()

    db = next(get_db())
    mc = MinIOManager()
    camera_obj = db.get(Camera, camera_id)

    if not camera_obj:
        await websocket.send_json({"error": "Camera not found"})
        await websocket.close(code=1003)
        return

    config = camera_obj.config or {}
    video_url = config.get("video_url")
    if not video_url:
        await websocket.send_json({"error": "Missing video_url in camera config"})
        await websocket.close()
        return

    video_name = os.path.basename(video_url)
    base_dir = f"frames-out/{camera_id}/{video_name}"
    frame_index = 1

    try:
        while True:
            frame_key = f"{base_dir}/frame_{frame_index}.jpg"
            print(frame_key)
            if not mc.client.stat_object(mc.bucket, frame_key):
                await asyncio.sleep(0.05)
                continue

            outputs = {
                "camera_id": camera_id,
                "frame_url": frame_key,
                "timestamp": int(datetime.utcnow().timestamp() * 1000),
            }
            await websocket.send_json(outputs)
            print(f"Sent frame: {frame_key}")
            frame_index += 1
            await asyncio.sleep(0.2)  # 20 fps

    except WebSocketDisconnect:
        print(f"WebSocket disconnected from camera {camera_id}")
    except Exception as e:
        print(f"Error during frame streaming: {e}")