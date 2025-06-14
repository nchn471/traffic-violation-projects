from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
import os

from storage.models.camera import Camera
from api.schemas.camera import CameraCreate, CameraOut, CameraUpdate
from storage.database import get_db
from storage.minio_manager import MinIOManager
camera_router = APIRouter(prefix="/api/v1/cameras", tags=["Cameras"])


    
@camera_router.get("/", response_model=list[CameraOut])
def get_all_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()

@camera_router.get("/{camera_id}", response_model=CameraOut)
def get_camera(camera_id: UUID, db: Session = Depends(get_db)):
    camera = db.query(Camera).get(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@camera_router.post("/", response_model=CameraOut, status_code=201)
def create_camera(data: CameraCreate, db: Session = Depends(get_db)):
    new_camera = Camera(**data.dict())
    db.add(new_camera)
    db.commit()
    db.refresh(new_camera)
    return new_camera


@camera_router.patch("/{camera_id}", response_model=CameraOut)
def update_camera(camera_id: UUID, data: CameraUpdate, db: Session = Depends(get_db)):
    camera = db.query(Camera).get(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(camera, key, value)
    
    db.commit()
    db.refresh(camera)
    return camera


@camera_router.delete("/{camera_id}", status_code=204)
def delete_camera(camera_id: UUID, db: Session = Depends(get_db)):
    camera = db.query(Camera).get(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(camera)
    db.commit()


@camera_router.get("/{camera_id}/videos", response_model=list[str])
def get_camera_videos(camera_id: UUID, db: Session = Depends(get_db)):
    camera = db.query(Camera).get(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    mc = MinIOManager()
    video_files = mc.list_file(camera.folder_path)
    return video_files
