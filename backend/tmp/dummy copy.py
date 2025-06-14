from uuid import uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from storage.database import get_db
from storage.models.camera import Camera


def insert_initial_cameras(db: Session):
    cameras = [
        {
            "name": "Camera 01",
            "location": "Camera 01",
            "folder_path": "violations/cameras/01"
        },
        {
            "name": "Camera 02",
            "location": "Camera 02",
            "folder_path": "violations/cameras/02"
        },
        {
            "name": "Camera 03",
            "location": "La Khê, Hà Đông",
            "folder_path": "violations/cameras/03"
        }
    ]

    for cam in cameras:
        new_camera = Camera(
            id=uuid4(),
            name=cam["name"],
            location=cam["location"],
            folder_path=cam["folder_path"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_camera)

    db.commit()
    print("✅ Đã insert 3 camera ban đầu thành công.")


if __name__ == "__main__":
    db = next(get_db())
    try:
        insert_initial_cameras(db)
    finally:
        db.close()
