import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from storage.models.officer import Officer
from ..schemas.auth import TokenPayload
from typing import Optional, Callable
from storage.database import get_db

load_dotenv()

SECRET_KEY_ACCESS = os.getenv("SECRET_KEY_ACCESS")
SECRET_KEY_REFRESH = os.getenv("SECRET_KEY_REFRESH")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY_ACCESS, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY_REFRESH, algorithm=ALGORITHM)


def verify_access_token(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    try:
        payload = jwt.decode(token, SECRET_KEY_ACCESS, algorithms=[ALGORITHM])
        return TokenPayload(**payload)
    except (JWTError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_refresh_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY_REFRESH, algorithms=[ALGORITHM])
    except JWTError:
        return None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str) -> Optional[Officer]:
    user = db.query(Officer).filter(Officer.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(
    payload: TokenPayload = Depends(verify_access_token),
    db: Session = Depends(get_db)
) -> Officer:
    user = db.query(Officer).filter(Officer.id == payload.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def require_roles(allowed_roles: list[str]) -> Callable:
    def role_dependency(current_user: Officer = Depends(get_current_user)) -> Officer:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required roles: {allowed_roles}"
            )
        return current_user
    return role_dependency


require_admin = require_roles(["admin"])
require_officer = require_roles(["officer"])
require_all = require_roles(["admin", "officer"])