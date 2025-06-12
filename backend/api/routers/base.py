from fastapi import APIRouter, HTTPException
from starlette.status import HTTP_200_OK, HTTP_500_INTERNAL_SERVER_ERROR
from storage.minio_manager import MinIOManager
from fastapi.responses import StreamingResponse
import aiohttp
import io

base_router = APIRouter(
    prefix="", 
    tags=["Welcome"],
    )



@base_router.get("/ping", status_code=HTTP_200_OK, summary="Health check endpoint")
def ping():
    try:
        return {"status": "ok"}
    except Exception:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server Error"
        )


@base_router.get("/", status_code=HTTP_200_OK, summary="Service information")
def root():
    try:
        return {
            "app": "FastAPI Auth Service",
            "description": "This is the base API of the authentication service.",
        }
    except Exception:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server Error"
        )
        
@base_router.get("/api/v1/media/{file_path:path}")
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
        return url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

