from uuid import uuid4
from datetime import datetime, timedelta
from random import choice, uniform
from sqlalchemy.orm import Session
from storage.models import Violation, Camera
from storage.database import get_db

def insert_dummy_violations(db: Session):
    camera_ids = [cam.id for cam in db.query(Camera).all()]
    if not camera_ids:
        print("⚠️ Không có camera nào để gán vi phạm.")
        return

    vehicle_types = ["car", "motorbike", "truck"]
    violation_types = ["speeding", "red_light", "no_plate"]
    license_plates = ["29A-12345", "30B-67890", "31C-11223", None]
    
    for i in range(10):
        violation = Violation(
            id=uuid4(),
            camera_id=choice(camera_ids),
            timestamp=datetime.utcnow() - timedelta(minutes=i*5),
            vehicle_type=choice(vehicle_types),
            violation_type=choice(violation_types),
            license_plate=choice(license_plates),
            confidence=round(uniform(0.75, 0.99), 2),
            frame_image_path=f"violations/frames/{i}.jpg",
            vehicle_image_path=f"violations/vehicles/{i}.jpg",
            lp_image_path=f"violations/plates/{i}.jpg" if i % 2 == 0 else None,
            status="pending",
        )
        db.add(violation)

    db.commit()
    print("✅ Đã insert 10 dummy violations thành công.")


if __name__ == "__main__":
    db = next(get_db())
    try:
        insert_dummy_violations(db)
    finally:
        db.close()
