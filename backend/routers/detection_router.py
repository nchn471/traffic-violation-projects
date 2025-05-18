from fastapi import APIRouter, Request, WebSocket
from fastapi.responses import HTMLResponse
from services.detection_service import handle_detection_websocket, get_video_list

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    video_files = get_video_list()
    return {"video_files": video_files}

@router.websocket("/ws/{video_name}")
async def detection_websocket(websocket: WebSocket, video_name: str):
    await handle_detection_websocket(websocket, video_name)
