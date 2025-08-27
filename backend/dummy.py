from uuid import uuid4
from datetime import datetime, timedelta, timezone
from random import choice, uniform
from sqlalchemy.orm import Session
from storage.models import Violation, Camera, ViolationVersion, Officer
from storage.database import get_db


def generate_vietnam_license_plates():
    provinces = ['29', '30', '31', '32', '33', '34', '35', '36', '37', '38']
    letters = ['A', 'B', 'C', 'D', 'E']
    def random_plate():
        return f"{choice(provinces)}{choice(letters)}-{choice(range(100, 999))}.{choice(range(10, 99))}"
    return [random_plate() for _ in range(50)]


def insert_dummy_violations(db: Session):
    camera_ids = [cam.id for cam in db.query(Camera).all()]
    officer_ids = [off.id for off in db.query(Officer).all()]

    if not camera_ids:
        print("⚠️ Không có camera nào để gán vi phạm.")
        return
    if not officer_ids:
        print("⚠️ Không có officer nào để ghi nhận version.")
        return

    vehicle_types = ['car', 'motorbike', 'truck', 'bus']
    violation_types = ["red_light", "no_helmet", "wrong_lane"]
    license_plates = generate_vietnam_license_plates()

    for i in range(100):
        violation_id = uuid4()
        version_id = uuid4()
        vehicle_type = choice(vehicle_types)
        violation_type = choice(violation_types)
        license_plate = choice(license_plates)
        confidence = round(uniform(0.75, 0.99), 2)
        camera_id = choice(camera_ids)
        officer_id = choice(officer_ids)

        frame_image_path = "violations/2025.05.27/02079954-93eb-49e4-b234-2373f4031a4b/frame.jpg"
        vehicle_image_path = "violations/2025.05.27/02079954-93eb-49e4-b234-2373f4031a4b/vehicle.jpg"
        lp_image_path = "violations/2025.05.27/02079954-93eb-49e4-b234-2373f4031a4b/lp.jpg" if i % 2 == 0 else None
        timestamp = datetime.now(timezone.utc) - timedelta(minutes=i * 5)

        # Step 1: Create Violation first with no version_id yet
        violation = Violation(
            id=violation_id,
            camera_id=camera_id,
            timestamp=timestamp,
            vehicle_type=vehicle_type,
            violation_type=violation_type,
            license_plate=license_plate,
            confidence=confidence,
            frame_image_path=frame_image_path,
            vehicle_image_path=vehicle_image_path,
            lp_image_path=lp_image_path,
            status="pending",
            version_id=None  # set later
        )
        db.add(violation)
        db.flush()

        # Step 2: Create Version after Violation exists
        version = ViolationVersion(
            id=version_id,
            violation_id=violation_id,
            officer_id=officer_id,
            timestamp=timestamp,
            vehicle_type=vehicle_type,
            violation_type=violation_type,
            license_plate=license_plate,
            confidence=confidence,
            frame_image_path=frame_image_path,
            vehicle_image_path=vehicle_image_path,
            lp_image_path=lp_image_path,
            updated_at=timestamp,
            change_type="create"
        )
        db.add(version)
        db.flush()

        # Step 3: Now update Violation to point to the version
        violation.version_id = version_id
        db.add(violation)

    db.commit()
    print("✅ Đã insert 100 dummy violations thành công.")


if __name__ == "__main__":
    db = next(get_db())
    try:
        insert_dummy_violations(db)
    finally:
        db.close()
