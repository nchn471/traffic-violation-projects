from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
import io
from fastapi.responses import StreamingResponse
from fastapi import Query, Body
from typing import List
from storage.models import Ticket, Violation, TicketVersion
from api.schemas.ticket import TicketCreate, TicketOut, TicketUpdate,TicketVersionOut
from api.utils.auth import require_all, require_admin
from storage.database import get_db
from api.utils.ticket import build_ticket_html, send_email, create_pdf_ticket

ticket_router = APIRouter(
    prefix="/api/v1/tickets",
    tags=["Tickets"]
)

@ticket_router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate = Body(...),
    db: Session = Depends(get_db),
    officer: dict = Depends(require_all),
):
    
    violation = db.query(Violation).filter(Violation.id == ticket_in.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    if violation.status != "approved":
        raise HTTPException(status_code=400, detail="Cannot create ticket for a violation that is not approved")

    existing_ticket = db.query(Ticket).filter(Ticket.violation_id == ticket_in.violation_id).first()
    if existing_ticket:
        raise HTTPException(status_code=400, detail="Ticket already exists for this violation")

    new_ticket = Ticket(
        violation_id=ticket_in.violation_id,
        officer_id=officer.id,
        amount=ticket_in.amount,
        email=ticket_in.email,
        name=ticket_in.name,
        notes=ticket_in.notes,
        status="draft",
    )
    db.add(new_ticket)
    db.flush()  

    version = TicketVersion(
        ticket_id=new_ticket.id,
        officer_id=officer.id,
        change_type="create",
        updated_at=datetime.now(timezone.utc),
        amount=new_ticket.amount,
        name=new_ticket.name,
        email=new_ticket.email,
        notes=new_ticket.notes,
        status=new_ticket.status,
        source_id=None,
    )
    db.add(version)
    db.flush() 

    new_ticket.version_id = version.id

    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@ticket_router.get("", response_model=TicketOut, dependencies=[Depends(require_all)])
def get_ticket_by_violation(
    violation_id: UUID = Query(..., description="ID của Violation"),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.violation_id == violation_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found for this violation")

    return ticket

@ticket_router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: UUID,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_all)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft tickets can be updated")
    
    update_fields = ticket_in.model_dump(exclude_unset=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_fields.items():
        setattr(ticket, key, value)

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=officer.id,
        change_type="update",
        updated_at=datetime.now(timezone.utc),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status,
        source_id=ticket.version_id
    )
    db.add(version)
    db.flush()

    ticket.version_id = version.id
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.delete("/{ticket_id}", response_model=TicketOut)
def archive_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_admin),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.status == "archived":
        raise HTTPException(status_code=400, detail="Ticket has already been archived")

    ticket.status = "archived"

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=officer.id,
        change_type="archive",
        updated_at=datetime.now(timezone.utc),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status,
        source_id=ticket.version_id,
    )
    db.add(version)
    db.flush()

    ticket.version_id = version.id
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.get("/{ticket_id}/history", response_model=List[TicketVersionOut], dependencies=[Depends(require_all)])
def get_ticket_history(
    ticket_id: UUID,
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    versions = (
        db.query(TicketVersion)
        .filter(TicketVersion.ticket_id == ticket_id)
        .order_by(TicketVersion.updated_at.desc())
        .all()
    )
    return versions

@ticket_router.post("/{ticket_id}/rollback/{version_id}", response_model=TicketOut)
def rollback_ticket(
    ticket_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_admin),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    version = db.query(TicketVersion).filter(TicketVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    if version.ticket_id != ticket.id:
        raise HTTPException(status_code=400, detail="This version does not belong to the ticket")

    if version.change_type == "rollback":
        raise HTTPException(status_code=400, detail="Cannot rollback from a rollback version")

    ticket.amount = version.amount
    ticket.name = version.name
    ticket.email = version.email
    ticket.notes = version.notes
    ticket.status = version.status

    rollback_version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=officer.id,
        change_type="rollback",
        updated_at=datetime.now(timezone.utc),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status,
        source_id=version.id,
    )
    db.add(rollback_version)
    db.flush()

    ticket.version_id = rollback_version.id
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.post("/{ticket_id}/mark-paid", response_model=TicketOut)
def mark_ticket_paid(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_all)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.status == "paid":
        raise HTTPException(status_code=400, detail="Ticket has already been paid")

    if ticket.status != "sent":
        raise HTTPException(
            status_code=400,
            detail="Only tickets that have been sent can be marked as paid"
        )

    ticket.status = "paid"

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=officer.id,
        change_type="status_update",
        updated_at=datetime.now(timezone.utc),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status,
        source_id=ticket.version_id
    )
    db.add(version)
    db.flush()
    ticket.version_id = version.id

    violation = db.query(Violation).filter(Violation.id == ticket.violation_id).first()
    if violation and violation.status != "done":
        violation.status = "done"

    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.get("/{ticket_id}/pdf", dependencies=[Depends(require_all)])
def download_ticket_pdf(ticket_id: UUID, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter_by(id=ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket không tồn tại")

    violation = db.query(Violation).filter_by(id=ticket.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")

    pdf_bytes = create_pdf_ticket(ticket, violation)
    filename = f"ticket_{ticket.id}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )


@ticket_router.post("/{ticket_id}/send", response_model=TicketOut)
def send_ticket_via_email(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    officer: dict = Depends(require_all),
):
    ticket = db.query(Ticket).filter_by(id=ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket không tồn tại")

    violation = db.query(Violation).filter_by(id=ticket.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")

    if ticket.status != "draft":
        raise HTTPException(status_code=400, detail="Chỉ có thể gửi ticket ở trạng thái 'draft'")

    try:
        pdf_bytes = create_pdf_ticket(ticket, violation)
        send_email(
            to_email=ticket.email,
            subject="Traffic Violation Ticket",
            ticket=ticket,
            violation=violation,
            attachment=pdf_bytes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi gửi email: {str(e)}")

    ticket.status = "sent"
    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=officer.id,
        change_type="send",
        updated_at=datetime.now(timezone.utc),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status,
        source_id=ticket.version_id,
    )

    db.add(version)
    db.flush()
    ticket.version_id = version.id
    db.commit()
    db.refresh(ticket)

    return ticket
