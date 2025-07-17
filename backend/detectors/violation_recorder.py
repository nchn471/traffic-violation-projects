import os
import uuid
import cv2
import tempfile
from storage.models.violation import Violation, ViolationVersion
from .license_plate_detector import LicensePlateDetector
import traceback

class ViolationRecorder(LicensePlateDetector):
    def __init__(self, lp_path, ocr_path, minio_client, db):
        super().__init__(lp_path, ocr_path, minio_client)
        self.db = db
        
    def _save_temp_image(self, image, filename, tmpdir):
        path = os.path.join(tmpdir, filename)
        cv2.imwrite(path, image)
        return path
    
    def save_violation_snapshot(self, data: dict):
        print(data)
        try:
            with tempfile.TemporaryDirectory() as tmpdir:

                camera_id = data.get("camera_id")
                violation_id = data.get("violation_id")
                vehicle_type = data.get("vehicle_type")
                violation_type = data.get("violation_type")
                confidence = data.get("confidence")
                vehicle_img_url = data.get("vehicle_img_url")
                frame_img_url = data.get("frame_img_url")
                timestamp = data.get("timestamp")
                vehicle_img_path = self.minio_client.get_file(vehicle_img_url, tmpdir)
                print(vehicle_img_path)
                vehicle_img = cv2.imread(vehicle_img_path)
                lp_img, lp_text = self.lp_recognition(vehicle_img)

                    
                version_id = str(uuid.uuid4())
                base_path = f"violations/{violation_id}"
                lp_path_local = self._save_temp_image(lp_img, "lp.jpg", tmpdir) if lp_img is not None else None
                lp_path = self.minio_client.upload_file(lp_path_local, f"{base_path}/lp.jpg") if lp_path_local else None

                violation = Violation(
                    id=violation_id,
                    camera_id=camera_id,
                    timestamp=timestamp,
                    vehicle_type=vehicle_type,
                    violation_type=violation_type,
                    license_plate=lp_text,
                    confidence=confidence,
                    frame_image_path=frame_img_url,
                    vehicle_image_path=vehicle_img_url,
                    lp_image_path=lp_path,
                    status="pending",
                    version_id=None
                )
                self.db.add(violation)
                self.db.flush()

                version = ViolationVersion(
                    id=version_id,
                    violation_id=violation_id,
                    officer_id=None,
                    timestamp=timestamp,
                    vehicle_type=vehicle_type,
                    violation_type=violation_type,
                    license_plate=lp_text,
                    confidence=confidence,
                    frame_image_path=frame_img_url,
                    vehicle_image_path=vehicle_img_url,
                    lp_image_path=lp_path,
                    updated_at=timestamp,
                    change_type="create"
                )
                self.db.add(version)
                self.db.flush()

                violation.version_id = version_id
                self.db.add(violation)
                self.db.commit()
                print(f"[ViolationRecorder] Violation saved:")

        except Exception as e:
            self.db.rollback()
            print(f"[ViolationRecorder] Failed to save violation: {e}")
            traceback.print_exc() 