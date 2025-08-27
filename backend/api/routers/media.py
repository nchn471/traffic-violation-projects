from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from starlette.status import HTTP_404_NOT_FOUND, HTTP_500_INTERNAL_SERVER_ERROR
from storage.minio_manager import MinIOManager
from api.utils.auth import require_all
import cv2
import aiohttp
import io

media_router = APIRouter(
    prefix="/api/v1/media",
    tags=["Media"],
    # dependencies=[Depends(require_all)]
)

from fastapi.responses import RedirectResponse

@media_router.get("/file/{file_path:path}")
async def get_media(file_path: str):
    mc = MinIOManager()
    try:
        url = mc.get_presigned_url(file_path)
        return RedirectResponse(url)
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi server: {str(e)}"
        )

# @media_router.get("/file/{file_path:path}")
# async def get_media(file_path: str):
#     mc = MinIOManager()

#     try:
#         url = mc.get_presigned_url(file_path)
#         async with aiohttp.ClientSession() as session:
#             async with session.get(url) as resp:
#                 if resp.status != 200:
#                     raise HTTPException(
#                         status_code=HTTP_404_NOT_FOUND,
#                         detail="Không tìm thấy file."
#                     )

#                 content_type = resp.headers.get("Content-Type", "application/octet-stream")
#                 content = await resp.read()
#                 return StreamingResponse(io.BytesIO(content), media_type=content_type)
            
#     except Exception as e:
#         raise HTTPException(
#             status_code=HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Lỗi server: {str(e)}"
#         )

@media_router.get("/thumbnail/{video_path:path}")
def get_video_thumbnail(video_path: str):
    
    mc = MinIOManager()

    try:
        local_path = mc.get_file(video_path)

        cap = cv2.VideoCapture(local_path)
        success, frame = cap.read()
        cap.release()

        if not success or frame is None:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Không đọc được video hoặc không có frame.")

        frame = cv2.resize(frame, (1280, 720), interpolation=cv2.INTER_AREA)
        success, buffer = cv2.imencode(".jpg", frame)
        if not success:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể encode ảnh.")

        return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")

    except Exception as e:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xử lý thumbnail: {e}"
        )