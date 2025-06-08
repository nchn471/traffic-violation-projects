import os
import uuid
import cv2
import tempfile
from storage.models.violation import Violation
from .license_plate_detector import LicensePlateDetector

class ViolationRecorder(LicensePlateDetector):

    def __init__(self, lp_path, ocr_path, minio_client, db):
        super().__init__(lp_path, ocr_path, minio_client)
        self.db = db

    def _save_temp_image(self, image, filename, tmpdir):
        path = os.path.join(tmpdir, filename)
        cv2.imwrite(path, image)
        return path

    def _upload_image(self, local_path, remote_path):
        return self.minio_client.upload_file(local_path, remote_path) if local_path else None

    def save_violation_snapshot(self, full_img, vehicle_img, vehicle_type, violation_type, location, confidence, timestamp):
        lp_img, lp_text = self.lp_recognition(vehicle_img)
        violation_id = str(uuid.uuid4())
        date_str = timestamp.strftime("%Y.%m.%d")
        base_path = f"violations/{date_str}/{violation_id}"

        with tempfile.TemporaryDirectory() as tmpdir:

            frame_path_local = self._save_temp_image(full_img, "frame.jpg", tmpdir)
            vehicle_path_local = self._save_temp_image(vehicle_img, "vehicle.jpg", tmpdir)
            lp_path_local = self._save_temp_image(lp_img, "lp.jpg", tmpdir) if lp_img is not None else None
            frame_path = self._upload_image(frame_path_local, f"{base_path}/frame.jpg")
            vehicle_path = self._upload_image(vehicle_path_local, f"{base_path}/vehicle.jpg")
            lp_path = self._upload_image(lp_path_local, f"{base_path}/lp.jpg")
            
        violation = Violation(
            id=violation_id,
            timestamp=timestamp,
            location=location,
            confidence=confidence,
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
