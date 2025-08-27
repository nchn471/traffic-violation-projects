from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from sqlalchemy import or_, cast, String
from sqlalchemy import func

from storage.models import Violation, ViolationVersion, Camera
from api.schemas.violation import (
    ViolationOut,
    ViolationUpdate,
    ViolationVersionOut,
    PaginatedViolations,
    Pagination,
    ViolationActionRequest
)
from api.utils.auth import require_all, require_admin
from storage.database import get_db
from datetime import datetime

violation_router = APIRouter(prefix="/api/v1/violations", tags=["Violations"])


@violation_router.get(
    "", response_model=PaginatedViolations, dependencies=[Depends(require_all)]
)
def get_violations(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    violation_type: Optional[str] = Query(None),
    license_plate: Optional[str] = Query(None),
    camera_id: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    confidence_min: Optional[float] = Query(None, ge=0, le=1),
    confidence_max: Optional[float] = Query(None, ge=0, le=1),
    timestamp_from: Optional[datetime] = Query(None),
    timestamp_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),  
):
    query = db.query(Violation)
    query = query.filter(
        or_(
            # Violation.violation_type == "red_light",  # Giữ lại red_light, bất kể biển số
            func.lower(Violation.license_plate) != "unknown"  # Với các loại khác thì bỏ unknown
        )
    )
    if status is None:
        query = query.filter(Violation.status != "archived")
    elif status != "all":
        query = query.filter(Violation.status == status)

    if violation_type:
        query = query.filter(Violation.violation_type == violation_type)

    if license_plate:
        query = query.filter(Violation.license_plate.ilike(f"%{license_plate}%"))

    if camera_id:
        query = query.filter(Violation.camera_id == camera_id)

    if vehicle_type:
        query = query.filter(Violation.vehicle_type == vehicle_type)

    if confidence_min is not None:
        query = query.filter(Violation.confidence >= confidence_min)

    if confidence_max is not None:
        query = query.filter(Violation.confidence <= confidence_max)

    if timestamp_from:
        query = query.filter(Violation.timestamp >= timestamp_from)

    if timestamp_to:
        query = query.filter(Violation.timestamp <= timestamp_to)


    if search:
        like_term = f"%{search}%"
        conditions = [
            cast(Violation.id, String).ilike(like_term),  
            Violation.license_plate.ilike(like_term),
            Violation.violation_type.ilike(like_term),
            Violation.vehicle_type.ilike(like_term),
            Violation.status.ilike(like_term),
            Violation.camera.has(Camera.name.ilike(like_term)),
            Violation.camera.has(Camera.location.ilike(like_term)),
        ]

        query = query.filter(or_(*conditions))

    total = query.count()
    total_pages = (total + limit - 1) // limit
    skip = (page - 1) * limit

    violations = (
        query
        .order_by(Violation.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return PaginatedViolations(
        pagination=Pagination(
            page=page,
            limit=limit,
            total=total,
            totalPages=total_pages,
        ),
        data=[ViolationOut.model_validate(v) for v in violations],
    )


@violation_router.get("/{violation_id}", response_model=ViolationOut, dependencies=[Depends(require_all)])
def get_violation(
    violation_id: UUID,
    db: Session = Depends(get_db),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    return violation

@violation_router.patch("/{violation_id}", response_model=ViolationOut)
def update_violation(
    violation_id: UUID,
    data: ViolationUpdate,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_all),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    officer_id = officer.id
    if not officer_id:
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    notes = data.notes or None

    for key, value in data.dict(exclude_unset=True, exclude={"notes"}).items():
        setattr(violation, key, value)

    db.flush()

    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=officer_id,
        change_type="update",
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
        status=violation.status,
        notes=notes,
        source_id=violation.version_id,
    )
    db.add(snapshot)
    db.flush()

    violation.version_id = snapshot.id

    db.commit()
    db.refresh(violation)
    return violation


@violation_router.delete("/{violation_id}", response_model=ViolationOut)
def archive_violation(
    violation_id: UUID,
    payload: ViolationActionRequest,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_admin),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    if violation.status == "archived":
        raise HTTPException(status_code=400, detail="Violation has already archived")

    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=officer.id,
        change_type="archive",
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
        status="archived",
        source_id=violation.version_id,
        notes=payload.notes
    )
    db.add(snapshot)
    db.flush()
    violation.status = "archived"
    violation.version_id = snapshot.id
    db.commit()
    db.refresh(violation)
    return violation


@violation_router.get(
    "/{violation_id}/history", response_model=List[ViolationVersionOut], dependencies=[Depends(require_all)]
)
def get_violation_history(
    violation_id: UUID,
    db: Session = Depends(get_db),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    camera = violation.camera

    versions = (
        db.query(ViolationVersion)
        .filter(ViolationVersion.violation_id == violation_id)
        .order_by(ViolationVersion.updated_at.desc())
        .all()
    )

    for version in versions:
        version.camera = camera

    return versions


@violation_router.post(
    "/{violation_id}/rollback/{version_id}", response_model=ViolationOut
)
def rollback_violation(
    violation_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_admin),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    version = (
        db.query(ViolationVersion).filter(ViolationVersion.id == version_id).first()
    )

    if not violation or not version:
        raise HTTPException(
            status_code=404,
            detail="Violation or version not found"
        )

    if version.violation_id != violation.id:
        raise HTTPException(
            status_code=400,
            detail="This version does not belong to the violation"
        )

    if version.change_type == "rollback":
        raise HTTPException(
            status_code=400,
            detail="Cannot rollback from a rollback version"
        )

    violation.timestamp = version.timestamp
    violation.vehicle_type = version.vehicle_type
    violation.violation_type = version.violation_type
    violation.license_plate = version.license_plate
    violation.confidence = version.confidence
    violation.frame_image_path = version.frame_image_path
    violation.vehicle_image_path = version.vehicle_image_path
    violation.lp_image_path = version.lp_image_path
    violation.status = version.status

    db.flush()  

    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=officer.id,
        change_type="rollback",
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
        status=violation.status,
        source_id=version.id,
        notes=f"Rollback to version {version.id}",
    )
    db.add(snapshot)
    db.flush()

    violation.version_id = snapshot.id

    db.commit()
    db.refresh(violation)
    return violation

@violation_router.patch("/{violation_id}/approve", response_model=ViolationOut)
def approve_violation(
    violation_id: UUID,
    payload: ViolationActionRequest,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_all),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    if violation.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only violations with 'pending' status can be approved"
        )

    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=officer.id,
        change_type="approve",
        notes=payload.notes,  
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
        source_id=violation.version_id,
        status="approved",
    )
    db.add(snapshot)
    db.flush()
    violation.status = "approved"
    violation.version_id = snapshot.id
    db.commit()
    db.refresh(violation)
    return violation

@violation_router.patch("/{violation_id}/reject", response_model=ViolationOut)
def reject_violation(
    violation_id: UUID,
    payload: ViolationActionRequest,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_all),
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    if violation.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only violations with 'pending' status can be rejected"
        )

    snapshot = ViolationVersion(
        violation_id=violation.id,
        officer_id=officer.id,
        change_type="reject",
        notes=payload.notes,
        timestamp=violation.timestamp,
        vehicle_type=violation.vehicle_type,
        violation_type=violation.violation_type,
        license_plate=violation.license_plate,
        confidence=violation.confidence,
        frame_image_path=violation.frame_image_path,
        vehicle_image_path=violation.vehicle_image_path,
        lp_image_path=violation.lp_image_path,
        status="rejected",
        source_id=violation.version_id
    )
    db.add(snapshot)
    db.flush()
    violation.status = "rejected"
    violation.version_id = snapshot.id
    db.commit()
    db.refresh(violation)
    return violation
