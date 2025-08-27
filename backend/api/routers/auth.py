from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import timedelta

from storage.database import get_db
from storage.models.officer import Officer
from api.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    TokenPayload,
)
from api.schemas.officer import OfficerOut
from api.utils.auth import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    authenticate_user,
    get_current_user,
)

auth_router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

ACCESS_TOKEN_EXPIRE = timedelta(minutes=60)
REFRESH_TOKEN_EXPIRE = timedelta(days=7)

@auth_router.post("/login", response_model=TokenResponse)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token_data = {
        "id": str(user.id),
        "sub": user.username,
        "role": user.role
    }

    return TokenResponse(
        access_token=create_access_token(token_data,ACCESS_TOKEN_EXPIRE),
        refresh_token=create_refresh_token(token_data, REFRESH_TOKEN_EXPIRE),
        token_type="bearer",
        access_token_expires_in=int(ACCESS_TOKEN_EXPIRE.total_seconds()),
        refresh_token_expires_in=int(REFRESH_TOKEN_EXPIRE.total_seconds())
    )


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh_token(token_req: RefreshTokenRequest):
    payload = verify_refresh_token(token_req.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    try:
        token_data = TokenPayload(**payload).model_dump()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    return TokenResponse(
        access_token=create_access_token(token_data,ACCESS_TOKEN_EXPIRE),
        refresh_token=create_refresh_token(token_data, REFRESH_TOKEN_EXPIRE),
        token_type="bearer",
        access_token_expires_in=int(ACCESS_TOKEN_EXPIRE.total_seconds()),
        refresh_token_expires_in=int(REFRESH_TOKEN_EXPIRE.total_seconds())
    )

@auth_router.get("/me", response_model=OfficerOut)
def get_me(
    current_user: Officer = Depends(get_current_user),
):
    return current_user


