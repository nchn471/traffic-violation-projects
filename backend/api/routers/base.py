from fastapi import APIRouter, HTTPException, Depends
from starlette.status import HTTP_200_OK, HTTP_500_INTERNAL_SERVER_ERROR

base_router = APIRouter(
    prefix="", 
    tags=["Welcome"],
    )

@base_router.get("/ping", status_code=HTTP_200_OK, summary="Health check endpoint")
def ping():
    return {"status": "ok"}

@base_router.get("/", status_code=HTTP_200_OK, summary="Service information")
def root():
    try:
        return "Violation Monitoring Backend System"

    except Exception:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server Error"
        )
        

