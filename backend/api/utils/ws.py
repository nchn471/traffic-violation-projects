import tempfile
import os
import cv2

def save_frame_to_minio(frame, session_id, frame_index, minio_client):
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        cv2.imwrite(tmp.name, frame)
        remote_path = f"frames-in/{session_id}/frame_{frame_index}.jpg"
        url = minio_client.upload_file(tmp.name, remote_path)
    os.remove(tmp.name)
    return url

def resize_frame(frame, width=1280, height=720):
    return cv2.resize(frame, (width, height))