from fastapi import APIRouter, HTTPException, Depends
from starlette.status import HTTP_200_OK, HTTP_500_INTERNAL_SERVER_ERROR
from storage.minio_manager import MinIOManager
from fastapi.responses import StreamingResponse, RedirectResponse
import aiohttp
import io
from api.utils.auth import require_all

media_router = APIRouter(
    prefix="/api/v1/media",
    tags=["Media"],
    dependencies=[Depends(require_all)]
)

@media_router.get("/{file_path:path}")
async def get_image(file_path: str):
    mc = MinIOManager()
    try:
        url = mc.get_presigned_url(file_path)
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=404, detail="Không tìm thấy ảnh.")

                content_type = resp.headers.get("Content-Type", "application/octet-stream")
                content = await resp.read()
                return StreamingResponse(io.BytesIO(content), media_type=content_type)
        # return RedirectResponse(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

