from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from storage.database import get_db
from storage.models.officer import Officer
from api.schemas.auth import RegisterRequest
from api.schemas.officer import OfficerOut, OfficerUpdate
from api.utils.auth import hash_password, require_admin, require_all
from uuid import UUID
from typing import List

officer_router = APIRouter(
    prefix="/api/v1/officers",
    tags=["Officer"],
)

@officer_router.post("/", response_model=OfficerOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_officer(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Officer).filter(Officer.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = Officer(
        username=data.username,
        hashed_password=hash_password(data.password),
        name=data.name or "New Officer",
        role=data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@officer_router.get("/{officer_id}", response_model=OfficerOut, dependencies=[Depends(require_all)])
def get_officer(officer_id: UUID, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")
    return officer

@officer_router.get("/", response_model=List[OfficerOut], dependencies=[Depends(require_admin)])
def list_officers(db: Session = Depends(get_db)):
    return db.query(Officer).all()

@officer_router.patch("/{officer_id}", response_model=OfficerOut, dependencies=[Depends(require_admin)])
def update_officer(officer_id: UUID, data: OfficerUpdate, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")

    if data.username is not None:
        officer.username = data.username
        
    if data.name is not None:
        officer.name = data.name
    if data.role is not None:
        officer.role = data.role
    if data.password is not None:
        officer.hashed_password = hash_password(data.password)  

    db.commit()
    db.refresh(officer)
    return officer

@officer_router.delete("/{officer_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_officer(officer_id: UUID, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(officer)
    db.commit()