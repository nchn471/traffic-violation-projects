from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID
import os
from api.utils.camera import send_camera_video
from storage.models.camera import Camera
from api.schemas.camera import CameraOut, CameraUpdate
from storage.database import get_db
from storage.minio_manager import MinIOManager
from api.utils.auth import require_admin, require_all

camera_router = APIRouter(
    prefix="/api/v1/cameras",
    tags=["Cameras"],
)

@camera_router.get("/", response_model=list[CameraOut], dependencies=[Depends(require_all)])
def get_all_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()

@camera_router.get("/{camera_id}", response_model=CameraOut, dependencies=[Depends(require_all)])
def get_camera(camera_id: UUID, db: Session = Depends(get_db)):
    camera = db.query(Camera).get(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

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

@camera_router.get("/{camera_id}/videos", response_model=list[str])
def get_camera_videos(camera_id: UUID, db: Session = Depends(get_db)):
    camera = db.query(Camera).get(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    mc = MinIOManager()
    video_files = mc.list_file(camera.folder_path)
    return video_files

@camera_router.post("/{camera_id}/send-frames", status_code=status.HTTP_202_ACCEPTED)
def send_frames_from_camera(
    camera_id: UUID,
    background_tasks: BackgroundTasks,
    frame_skip: int = 3,
    max_frames: int = 300,
    db: Session = Depends(get_db),
):
    
    camera = db.query(Camera).get(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    video_url = camera.config.get("video_url") if camera.config else None
    if not video_url:
        raise HTTPException(status_code=400, detail="Missing video_url in camera config")

    background_tasks.add_task(
        send_camera_video,
        camera_id=str(camera_id),
        frame_skip=frame_skip,
        max_frames=max_frames,
    )

    return {
        "status": "accepted",
        "camera_id": str(camera_id),
        "camera_name": camera.name,
        "message": f"Started sending frames for camera '{camera.name}'"
    }


