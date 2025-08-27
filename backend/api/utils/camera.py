import cv2
import uuid
import os
import tempfile
from datetime import datetime
from dotenv import load_dotenv

from storage.minio_manager import MinIOManager
from kafka_handlers.kafka_producer import KafkaAvroProducer
from storage.database import get_db
from storage.models.camera import Camera

# Load environment variables
load_dotenv()

# ===== Configurations =====
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
SCHEMA_REGISTRY_URL = os.getenv("SCHEMA_REGISTRY_URL")
SCHEMA_SUBJECT = "frames-in-value"

# ===== Kafka Producer Initialization =====
def to_dict(obj, ctx):
    return obj

producer = KafkaAvroProducer(
    brokers=KAFKA_BOOTSTRAP_SERVERS,
    schema_registry_url=SCHEMA_REGISTRY_URL,
    topic="frames-in",
    schema_registry_subject=SCHEMA_SUBJECT,
    to_dict_func=to_dict,
)

# ===== Helper Functions =====
def resize_frame(frame, width=1280, height=720):
    return cv2.resize(frame, (width, height))

def save_frame_to_minio(frame, camera_id, video_name, frame_index, minio_client):
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        cv2.imwrite(tmp.name, frame)
        remote_path = f"frames-in/{camera_id}/{video_name}/frame_{frame_index}.jpg"
        url = minio_client.upload_file(tmp.name, remote_path)
    os.remove(tmp.name)
    return url

def send_camera_video(camera_id: str, frame_skip=3, max_frames=500):

    db = next(get_db()) 
    try:
        camera_obj = db.get(Camera, camera_id)
        if not camera_obj or not camera_obj.config or not camera_obj.config.get("video_url"):
            print(f"[ERROR] Camera {camera_id} not found or missing video_url")
            return

        config = camera_obj.config
        video_url = config["video_url"]
        video_name = os.path.basename(video_url)

        print(f"Processing Camera: {camera_obj.name} ({camera_id})")
        print(f"Video: {video_url}")

        minio_client = MinIOManager()
        
        # out_folder = f"frames-out/{camera_id}/{video_name}"
        # minio_client.client.remove_folder(out_folder)
        video_path = minio_client.get_file(video_url)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"[ERROR] Cannot open video: {video_path}")
            return

        session_id = str(uuid.uuid4())
        print(f"Session ID: {session_id}")

        total_read = 0
        total_sent = 0

        while cap.isOpened() and total_sent < max_frames:
            ret, frame = cap.read()
            if not ret:
                print(f"[EOF] Reached end of video.")
                break

            if total_read % frame_skip == 0:
                resized_frame = resize_frame(frame)
                frame_url = save_frame_to_minio(resized_frame, camera_id, video_name, total_sent + 1, minio_client)

                message = {
                    "session_id": session_id,
                    "camera_id": camera_id,
                    "frame_url": frame_url,
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    **config,
                }

                try:
                    producer.publish(value=message, key=session_id)
                    producer.producer.poll(0)
                    print(f"[{total_read}] Frame {total_sent + 1} sent: {frame_url}")
                    total_sent += 1
                except Exception as e:
                    print(f"[ERROR] Kafka publish failed: {e}")

            total_read += 1

        print(f"Done. Frames read: {total_read}, Frames sent: {total_sent}")

    except Exception as e:
        print(f"[EXCEPTION] {e}")

    finally:
        cap.release()
        os.remove(video_path)
        producer.producer.flush()
        db.close()  
