from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from storage.database import get_db
from storage.models.officer import Officer
from api.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest
)
from api.utils.auth import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    verify_access_token
)

auth_router = APIRouter(
    prefix="/api/v1/auth", 
    tags=["Authentication"],
    # dependencies=[Depends(verify_access_token)]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(Officer).filter(Officer.username == username).first()
    if not user or not verify_password(password, user.password):
        return None
    return user


@auth_router.post("/login", response_model=TokenResponse)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token_data = {
        "id": str(user.id),
        "sub": user.username
    } 
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@auth_router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(Officer).filter(Officer.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    new_user = Officer(
        username=data.username,
        password=hash_password(data.password),
        name=data.name or "New Officer",
        avatar_url=data.avatar_url,
        role=data.role
    )
    db.add(new_user)
    db.commit()
    token_data = {
        "id": str(new_user.id),
        "sub": new_user.username
    } 
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh_token(token_req: RefreshTokenRequest):
    payload = verify_refresh_token(token_req.refresh_token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    access_token = create_access_token({"sub": username})
    refresh_token = create_refresh_token({"sub": username})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@auth_router.get("/protected")
def protected_route(payload: dict = Depends(verify_access_token)):
    username = payload.get("sub")
    return {"message": f"Hello {username}"}

@auth_router.get("/me")
def get_current_user(
    payload: dict = Depends(verify_access_token),
    db: Session = Depends(get_db)
):
    username = payload.get("sub")
    user = db.query(Officer).filter(Officer.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user.id),
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
    }