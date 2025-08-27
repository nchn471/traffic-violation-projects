from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from storage.database import get_db
from storage.models.officer import Officer
from api.schemas.auth import RegisterRequest
from api.schemas.officer import OfficerOut, OfficerUpdate
from api.utils.auth import hash_password, require_admin, require_all

officer_router = APIRouter(
    prefix="/api/v1/officers",
    tags=["Officer"],
)

# ---------------------- CREATE OFFICER ----------------------


@officer_router.post(
    "/",
    response_model=OfficerOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_officer(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Officer).filter(Officer.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_officer = Officer(
        username=data.username,
        hashed_password=hash_password(data.password),
        name=data.name or "New Officer",
        role=data.role,
    )
    db.add(new_officer)
    db.commit()
    db.refresh(new_officer)
    return new_officer


# ---------------------- GET ONE OFFICER ----------------------


@officer_router.get(
    "/{officer_id}", response_model=OfficerOut, dependencies=[Depends(require_all)]
)
def get_officer(officer_id: UUID, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")
    return officer


# ---------------------- LIST ALL OFFICERS ----------------------


@officer_router.get(
    "/", response_model=List[OfficerOut], dependencies=[Depends(require_admin)]
)
def list_officers(db: Session = Depends(get_db)):
    return db.query(Officer).all()


# ---------------------- UPDATE OFFICER ----------------------


@officer_router.patch(
    "/{officer_id}", response_model=OfficerOut, dependencies=[Depends(require_admin)]
)
def update_officer(
    officer_id: UUID, data: OfficerUpdate, db: Session = Depends(get_db)
):
    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for duplicate username (skip self)
    if data.username and data.username != officer.username:
        existing = db.query(Officer).filter(Officer.username == data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        officer.username = data.username

    if data.name is not None:
        officer.name = data.name

    if data.role is not None:
        officer.role = data.role

    if data.password:
        officer.hashed_password = hash_password(data.password)

    db.commit()
    db.refresh(officer)
    return officer


# ---------------------- DELETE OFFICER ----------------------


@officer_router.delete(
    "/{officer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_officer(officer_id: UUID, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(officer)
    db.commit()
