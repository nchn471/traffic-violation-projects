import os
import uuid
import cv2
import tempfile
from datetime import datetime
from storage.models.violation import Violation
from .license_plate_detector import LicensePlateDetector

class ViolationRecorder(LicensePlateDetector):
    
    def __init__(self, lp__path, ocr_path, minio_client, params, db):
        super().__init__(lp__path, ocr_path, minio_client, params)
        self.db = db

    def save_violation_snapshot(self, full_img, vehicle_img, vehicle_type, violation_type,location):

        lp_img, lp_text = self.lp_recognition(vehicle_img)

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

            frame_path = self.minio_client.upload_file(frame_local, f"{base_path}/frame.jpg")
            vehicle_path = self.minio_client.upload_file(vehicle_local, f"{base_path}/vehicle.jpg")
            lp_path = self.minio_client.upload_file(lp_local, f"{base_path}/lp.jpg") if lp_local else None

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
