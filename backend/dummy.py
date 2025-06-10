import uuid
from datetime import datetime, timedelta
from random import choice, uniform, randint
from sqlalchemy.orm import Session
from storage.database import get_db
from storage.models.camera import Camera, CameraRecord
from storage.models.violation import Violation

# Danh sách giả lập
CAMERA_NAMES = [
    "Camera Q1 - Trần Hưng Đạo",
    "Camera Q3 - Cách Mạng Tháng Tám",
    "Camera Tân Bình - Lạc Long Quân",
    "Camera Thủ Đức - Võ Văn Ngân",
    "Camera Bình Thạnh - Điện Biên Phủ"
]
LOCATIONS = [
    "Quận 1, TP.HCM", "Quận 3, TP.HCM", "Quận Tân Bình", "Quận Thủ Đức", "Quận Bình Thạnh"
]
VEHICLE_TYPES = ["car", "motorbike", "truck", "bus"]
VIOLATION_TYPES = ["no_helmet", "speeding", "red_light", "wrong_lane"]
LICENSE_PLATES = ["59A-12345", "51B-67890", "30F-11111", "29C-54321", "77H-00001"]
IMAGE_PATHS = {
    "frame": "/images/frames/frame_{i}.jpg",
    "vehicle": "/images/vehicles/vehicle_{i}.jpg",
    "lp": "/images/plates/lp_{i}.jpg"
}

def seed_all(db: Session, camera_count=5, records_per_camera=3, violations_per_record=3):
    camera_records = []

    # Seed Cameras and CameraRecords
    for i in range(camera_count):
        camera = Camera(
            id=uuid.uuid4(),
            name=CAMERA_NAMES[i % len(CAMERA_NAMES)],
            location=LOCATIONS[i % len(LOCATIONS)],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(camera)
        db.flush()  # lấy camera.id

        for j in range(records_per_camera):
            record = CameraRecord(
                id=uuid.uuid4(),
                camera_id=camera.id,
                video_path=f"/videos/camera_{i}_record_{j}.mp4",
                created_at=datetime.utcnow() - timedelta(days=randint(0, 30)),
                updated_at=datetime.utcnow()
            )
            db.add(record)
            db.flush()
            camera_records.append(record)

    # Seed Violations
    total_violations = 0
    for idx, record in enumerate(camera_records):
        for k in range(violations_per_record):
            violation = Violation(
                id=uuid.uuid4(),
                record_id=record.id,
                version_id=None,
                timestamp=record.created_at + timedelta(minutes=randint(1, 10)),
                vehicle_type=choice(VEHICLE_TYPES),
                violation_type=choice(VIOLATION_TYPES),
                license_plate=choice(LICENSE_PLATES),
                confidence=round(uniform(0.7, 0.99), 2),
                frame_image_path=IMAGE_PATHS["frame"].format(i=total_violations),
                vehicle_image_path=IMAGE_PATHS["vehicle"].format(i=total_violations),
                lp_image_path=IMAGE_PATHS["lp"].format(i=total_violations) if randint(0, 1) else None,
                status=choice(["pending", "approved", "archived"])
            )
            db.add(violation)
            total_violations += 1

    db.commit()
    print(f"✅ Seed thành công:")
    print(f"  - {camera_count} cameras")
    print(f"  - {camera_count * records_per_camera} records")
    print(f"  - {total_violations} violations")


if __name__ == "__main__":
    db = next(get_db())
    try:
        seed_all(db, camera_count=5, records_per_camera=3, violations_per_record=4)
    finally:
        db.close()
