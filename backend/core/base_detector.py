import cv2
import uuid
import os
import tempfile
from datetime import datetime
from ultralytics import YOLO


class BaseDetector:

    def __init__(self, minio_client, config=None):

        self.RED_BGR = (99, 49, 222)
        self.GREEN_BGR = (105, 121, 9)
        self.BLUE_BGR = (186, 82, 15)
        self.WHITE_BGR = (255, 255, 255)
        self.YELLOW_BGR = (0, 255, 255)
        self.BLACK_BGR = (0, 0, 0)
        self.minio_client = minio_client

        if config:
            self.config = config

        self.violated_ids = set()

    def load_model(self, model_path: str):
        print(f"Load Model: {model_path}")
        local_path = self.minio_client.get_file(model_path)
        return YOLO(local_path)

    def draw_bounding_box(
        self,
        roi,
        x1,
        y1,
        x2,
        y2,
        color=(0, 255, 0),
        label=None,
        font_scale=0.5,
        thickness=2,
    ):
        cv2.rectangle(roi, (x1, y1), (x2, y2), color, thickness)

        if label:
            font = cv2.FONT_HERSHEY_SIMPLEX
            (text_w, text_h), _ = cv2.getTextSize(label, font, font_scale, 1)
            text_bg_top = max(y1 - text_h - 6, 0)
            text_bg_right = x1 + text_w + 6
            text_bg_bottom = y1
            cv2.rectangle(
                roi, (x1, text_bg_top), (text_bg_right, text_bg_bottom), color, -1
            )
            cv2.putText(
                roi,
                label,
                (x1 + 3, y1 - 3),
                font,
                font_scale,
                self.WHITE_BGR,
                1,
                cv2.LINE_AA,
            )

    def save_temp_image(self, image, filename, tmpdir):
        path = os.path.join(tmpdir, filename)
        cv2.imwrite(path, image)
        return path

    def track_violation(
        self,
        session_id,
        camera_id,
        violation_type,
        confidence,
        vehicle_type,
        frame_img,
        vehicle_img,
    ):
        violation_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp() * 1000)

        with tempfile.TemporaryDirectory() as tmpdir:
            base_path = f"violations/{violation_id}"

            frame_path_local = self.save_temp_image(frame_img, "frame.jpg", tmpdir)
            vehicle_path_local = self.save_temp_image(
                vehicle_img, "vehicle.jpg", tmpdir
            )

            frame_img_url = self.minio_client.upload_file(
                frame_path_local, f"{base_path}/frame.jpg"
            )
            vehicle_img_url = self.minio_client.upload_file(
                vehicle_path_local, f"{base_path}/vehicle.jpg"
            )

        violation = {
            "violation_id": violation_id,
            "session_id": session_id,
            "camera_id": camera_id,
            "violation_type": violation_type,
            "vehicle_type": vehicle_type,
            "confidence": confidence,
            "timestamp": timestamp,
            "frame_img_url": frame_img_url,
            "vehicle_img_url": vehicle_img_url,
        }

        return violation

    def draw_label_top_left(
        self,
        image,
        text: str,
        *,
        line: int = 0,
        font_scale: float = 0.8,
        font_thickness: int = 2,
        margin: int = 10,
        line_spacing: int = 10,
        padding: int = 6,
        text_color: tuple = (255, 255, 255),
        background_color: tuple = None

    ):
        font = cv2.FONT_HERSHEY_SIMPLEX
        (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, font_thickness)

        x = margin
        y = margin + (text_h + line_spacing) * (line + 1)

        if background_color is not None:
            cv2.rectangle(
                image,
                (x - padding, y - text_h - padding),
                (x + text_w + padding, y + padding),
                background_color,
                thickness=-1
            )

        cv2.putText(
            image,
            text,
            (x, y),
            font,
            font_scale,
            text_color,
            thickness=font_thickness,
            lineType=cv2.LINE_AA
        )
