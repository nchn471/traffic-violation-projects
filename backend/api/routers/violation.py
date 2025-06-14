from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from storage.models import Violation, ViolationVersion
from api.schemas.violation import ViolationOut, ViolationCreate, ViolationUpdate, ViolationVersionOut, PaginatedViolations, Pagination
from api.utils.auth import verify_access_token
from storage.database import get_db

violation_router = APIRouter(
    prefix="/api/v1/violations", 
    tags=["Violations"],
    dependencies=[Depends(verify_access_token)]
    )


@violation_router.get("", response_model=PaginatedViolations)
def get_violations(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    violation_type: Optional[str] = Query(None),
):
    query = db.query(Violation)
    if status:
        query = query.filter(Violation.status == status)
    if violation_type:
        query = query.filter(Violation.violation_type == violation_type)

    total = query.count()
    total_pages = (total + limit - 1) // limit  

    skip = (page - 1) * limit
    violations = query.offset(skip).limit(limit).all()

    return PaginatedViolations(
        pagination=Pagination(
            page=page,
            limit=limit,
            total=total,
            totalPages=total_pages,
        ),
        data=[ViolationOut.from_orm(v) for v in violations]
    )



@violation_router.get("/{violation_id}", response_model=ViolationOut)
def get_violation(
    violation_id: UUID,
    db: Session = Depends(get_db),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")
    return violation


@violation_router.post("", response_model=ViolationOut, status_code=status.HTTP_201_CREATED)
def create_violation(
    data: ViolationCreate,
    db: Session = Depends(get_db),
):
    violation = Violation(**data.dict())
    db.add(violation)
    db.commit()
    db.refresh(violation)
    return violation


@violation_router.patch("/{violation_id}", response_model=ViolationOut)
def update_violation(
    violation_id: UUID,
    data: ViolationUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_access_token)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")

    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=token_data.get("id"),
        change_type="update",
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
    )
    db.add(snapshot)
    db.flush()  

    for key, value in data.dict(exclude_unset=True).items():
        setattr(violation, key, value)
    
    violation.version_id = snapshot.id  
    db.commit()
    db.refresh(violation)
    return violation


@violation_router.delete("/{violation_id}", response_model=ViolationOut)
def archive_violation(
    violation_id: UUID,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_access_token)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")

    if violation.status == "archived":
        raise HTTPException(status_code=400, detail="Violation đã bị lưu trữ trước đó")

    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=token_data.get("id"),
        change_type="archive",
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
    )
    db.add(snapshot)
    db.flush() 
    violation.status = "archived"
    violation.version_id = snapshot.id
    db.commit()
    db.refresh(violation)
    return violation


@violation_router.get("/{violation_id}/history", response_model=List[ViolationVersionOut])
def get_violation_history(
    violation_id: UUID,
    db: Session = Depends(get_db),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")
    
    versions = (
        db.query(ViolationVersion)
        .filter(ViolationVersion.violation_id == violation_id)
        .order_by(ViolationVersion.updated_at.desc())
        .all()
    )
    return versions



@violation_router.post("/{violation_id}/rollback/{version_id}", response_model=ViolationOut)
def rollback_violation(
    violation_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_access_token)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    version = db.query(ViolationVersion).filter(ViolationVersion.id == version_id).first()
    
    if not violation or not version:
        raise HTTPException(status_code=404, detail="Violation hoặc phiên bản không tồn tại")

    if version.violation_id != violation.id:
        raise HTTPException(status_code=400, detail="Phiên bản không thuộc về Violation này")

    if version.change_type == "rollback":
        raise HTTPException(status_code=400, detail="Không thể rollback từ một phiên bản rollback.")

    # Tạo snapshot trước khi rollback
    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=token_data.get("id"),
        change_type="rollback",
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
    )
    db.add(snapshot)
    db.flush()

    # Rollback dữ liệu từ version đã chọn
    violation.timestamp = version.timestamp
    violation.vehicle_type = version.vehicle_type
    violation.violation_type = version.violation_type
    violation.license_plate = version.license_plate
    violation.confidence = version.confidence
    violation.frame_image_path = version.frame_image_path
    violation.vehicle_image_path = version.vehicle_image_path
    violation.lp_image_path = version.lp_image_path

    violation.version_id = snapshot.id
    db.commit()
    db.refresh(violation)
    return violation
