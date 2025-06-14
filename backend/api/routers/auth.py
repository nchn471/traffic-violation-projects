from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from storage.database import get_db
from storage.models.officer import Officer
from api.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest
)
from api.schemas.officer import OfficerOut
from api.utils.auth import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    verify_access_token,
    authenticate_user,
    hash_password
)

auth_router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


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
        "sub": user.username
    }

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        token_type="bearer"
    )


@auth_router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Officer).filter(Officer.username == data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    new_user = Officer(
        username=data.username,
        hashed_password=hash_password(data.password),
        name=data.name or "New Officer",
        role=data.role
    )
    db.add(new_user)
    db.commit()

    token_data = {
        "id": str(new_user.id),
        "sub": new_user.username
    }

    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        token_type="bearer"
    )


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh_token(token_req: RefreshTokenRequest):
    payload = verify_refresh_token(token_req.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    return TokenResponse(
        access_token=create_access_token({"sub": username}),
        refresh_token=create_refresh_token({"sub": username}),
        token_type="bearer"
    )


@auth_router.get("/me", response_model=OfficerOut)
def get_current_user(
    payload: dict = Depends(verify_access_token),
    db: Session = Depends(get_db)
):
    username = payload.get("sub")
    user = db.query(Officer).filter(Officer.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
