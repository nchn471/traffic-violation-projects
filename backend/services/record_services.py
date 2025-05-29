import os
import uuid
import cv2
import tempfile
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from storage.minio_manager import MinIOManager, MINIO_CONFIG
from storage.models.violation import Violation

load_dotenv()

class ViolationRecorder:
    def __init__(self, db: Session, config = MINIO_CONFIG ):
        self.config = config
        self.bucket = config.get("bucket")
        self.db = db
        self.minio_manager = MinIOManager(config)

    def save_violation_snapshot(
        self,
        vehicle_type: str,
        violation_type: str,
        location: str,
        full_img,
        vehicle_img,
        lp_img=None,
        lp_text: str = None
    ):
        violation_id = str(uuid.uuid4())
        timestamp = datetime.now()
        date_str = timestamp.strftime("%Y.%m.%d")
        base_path = f"violations/{date_str}/{violation_id}"

        with tempfile.TemporaryDirectory() as tmpdir:
            frame_local = os.path.join(tmpdir, "frame.jpg")
            vehicle_local = os.path.join(tmpdir, "vehicle.jpg")
            cv2.imwrite(frame_local, full_img)
            cv2.imwrite(vehicle_local, vehicle_img)

            lp_local = None
            if lp_img is not None:
                lp_local = os.path.join(tmpdir, "lp.jpg")
                cv2.imwrite(lp_local, lp_img)

            frame_path = self.minio_manager.upload_file(frame_local, f"{base_path}/frame.jpg")
            vehicle_path = self.minio_manager.upload_file(vehicle_local, f"{base_path}/vehicle.jpg")
            lp_path = self.minio_manager.upload_file(lp_local, f"{base_path}/lp.jpg") if lp_local else None

        violation = Violation(
            id=violation_id,
            timestamp=timestamp,
            location=location,
            vehicle_type=vehicle_type,
            violation_type=violation_type,
            license_plate=lp_text,
            frame_image_path=frame_path,
            vehicle_image_path=vehicle_path,
            lp_image_path=lp_path
        )

        try:
            self.db.add(violation)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            print(f"[ViolationRecorder] Failed to save to DB: {e}")

        return {
            "violation_id": violation_id,
            "frame_path": frame_path,
            "vehicle_path": vehicle_path,
            "lp_path": lp_path,
            "lp_text": lp_text,
        }
