import cv2
import uuid
import os
import tempfile
from datetime import datetime
from dotenv import load_dotenv

from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaAvroProducer
from storage.database import get_db_local
from storage.models.camera import Camera

load_dotenv()

# ===== Config =====
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_EXTERNAL_SERVERS", "kafka:9092")
SCHEMA_REGISTRY_URL = "http://localhost:8081"
SCHEMA_SUBJECT = "frames-in-value"

MINIO_CONFIG = {
    "endpoint_url": "localhost:9000",
    "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
    "bucket": os.getenv("MINIO_BUCKET"),
}


# ===== Kafka Producer =====
def to_dict(obj, ctx):
    return obj


producer = KafkaAvroProducer(
    brokers=KAFKA_BOOTSTRAP_SERVERS,
    schema_registry_url=SCHEMA_REGISTRY_URL,
    topic="frames-in",
    schema_registry_subject=SCHEMA_SUBJECT,
    to_dict_func=to_dict,
)


# ===== Helper =====
def resize_frame(frame, width=1280, height=720):
    return cv2.resize(frame, (width, height))


def save_frame_to_minio(frame, camera_id, video_name, frame_index, minio_client):
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        cv2.imwrite(tmp.name, frame)
        remote_path = f"frames-in/{camera_id}/{video_name}/frame_{frame_index}.jpg"
        url = minio_client.upload_file(tmp.name, remote_path)
    os.remove(tmp.name)
    return url


# ===== Main Function =====
def send_camera_video(camera_id: str, frame_skip=3, max_frames=500):
    db = next(get_db_local())
    camera_obj = db.get(Camera, camera_id)

    if not camera_obj or not camera_obj.config or not camera_obj.config.get("video_url"):
        raise ValueError("Camera not found or missing video_url")

    config = camera_obj.config
    video_name = os.path.basename(config['video_url'])
    
    print(f"🎥 Camera: {camera_obj.name}, video_url: {config['video_url']}")

    minio_client = MinIOManager(MINIO_CONFIG)
    video_path = minio_client.get_file(config["video_url"])

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError("Could not open video")

    session_id = str(uuid.uuid4())
    print(f"📤 Session ID: {session_id}")
    i = 0
    sent = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if sent >= max_frames:
                print(f"🛑 Stopped after sending {sent} frames.")
                break

            if i % frame_skip == 0:
                frame = resize_frame(frame)
                frame_url = save_frame_to_minio(frame, camera_id, video_name, sent + 1, minio_client)

                message = {
                    "session_id": session_id,
                    "camera_id": camera_id,
                    "frame_url": frame_url,
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    **config,  # full config from camera
                }

                producer.publish(value=message, key=session_id)
                producer.producer.poll(0)

                print(f"[{i}] ✅ Sent frame {sent+1}: {frame_url}")
                sent += 1

            i += 1
    finally:
        cap.release()
        os.remove(video_path)
        producer.producer.flush()
        print(f"✅ Done. Total frames read: {i}, frames sent: {sent}")


if __name__ == "__main__":
    # 💡 Nhập UUID camera ở đây
    cam1 = "b9209722-f12e-4c2c-b6ec-230b15ca44b1"
    cam2 = "8be6d3c5-dc29-4377-853e-8f0df9cf163b"
    cam3 = "1d5e4b5f-91f3-42f7-b5ec-ec5476423ad9"
    camera_id = cam1
    frame_skip = 3
    max_frames = 300

    send_camera_video(camera_id=camera_id, frame_skip=frame_skip, max_frames=max_frames)
