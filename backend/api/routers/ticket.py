from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
import io
import requests
from fastapi.responses import StreamingResponse

from storage.models import Ticket, Violation, TicketVersion
from api.schemas.ticket import TicketCreate, TicketOut, TicketUpdate
from api.utils.auth import verify_access_token
from storage.database import get_db
from api.utils.ticket import build_ticket_html, send_email, create_pdf_ticket

ticket_router = APIRouter(
    prefix="/api/v1/tickets",
    tags=["Tickets"],
    dependencies=[Depends(verify_access_token)]
)

@ticket_router.post("/{violation_id}", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    violation_id: UUID,
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_access_token)
):
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    if db.query(Ticket).filter(Ticket.violation_id == violation_id).first():
        raise HTTPException(status_code=400, detail="Ticket already exists for this violation")

    new_ticket = Ticket(
        violation_id=violation_id,
        officer_id=token_data["id"],
        amount=ticket_in.amount,
        email=ticket_in.email,
        name=ticket_in.name,
        notes=ticket_in.notes,
        status="pending"
    )
    db.add(new_ticket)
    db.flush()

    version = TicketVersion(
        ticket_id=new_ticket.id,
        officer_id=token_data["id"],
        change_type="create",
        updated_at=datetime.utcnow(),
        amount=new_ticket.amount,
        name=new_ticket.name,
        email=new_ticket.email,
        notes=new_ticket.notes,
        status=new_ticket.status,
    )
    db.add(version)
    db.flush()

    new_ticket.version_id = version.id
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@ticket_router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: UUID,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_access_token)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    update_fields = ticket_in.model_dump(exclude_unset=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="Không có trường nào được cập nhật")

    for key, value in update_fields.items():
        setattr(ticket, key, value)

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=token_data["id"],
        change_type="update",
        updated_at=datetime.utcnow(),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status
    )
    db.add(version)
    db.flush()

    ticket.version_id = version.id
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.delete("/{ticket_id}", response_model=TicketOut)
def archive_ticket(ticket_id: UUID, db: Session = Depends(get_db), token_data: dict = Depends(verify_access_token)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket không tồn tại")

    if ticket.status == "archived":
        raise HTTPException(status_code=400, detail="Ticket đã bị lưu trữ trước đó")

    ticket.status = "archived"

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=token_data["id"],
        change_type="archive",
        updated_at=datetime.utcnow(),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status
    )
    db.add(version)
    db.flush()

    ticket.version_id = version.id
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.post("/{ticket_id}/rollback/{version_id}", response_model=TicketOut)
def rollback_ticket(ticket_id: UUID, version_id: UUID, db: Session = Depends(get_db), token_data: dict = Depends(verify_access_token)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    version = db.query(TicketVersion).filter(TicketVersion.id == version_id).first()

    if not ticket or not version:
        raise HTTPException(status_code=404, detail="Ticket hoặc phiên bản không tồn tại")
    if version.ticket_id != ticket.id:
        raise HTTPException(status_code=400, detail="Phiên bản không thuộc về Ticket này")
    if version.change_type == "rollback":
        raise HTTPException(status_code=400, detail="Không thể rollback từ một phiên bản rollback")

    ticket.amount = version.amount
    ticket.name = version.name
    ticket.email = version.email
    ticket.notes = version.notes
    ticket.status = version.status

    rollback_version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=token_data["id"],
        change_type="rollback",
        updated_at=datetime.utcnow(),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status
    )
    db.add(rollback_version)
    db.flush()

    ticket.version_id = rollback_version.id
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.post("/{ticket_id}/mark-paid", response_model=TicketOut)
def mark_ticket_paid(ticket_id: UUID, db: Session = Depends(get_db), token_data: dict = Depends(verify_access_token)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket không tồn tại")
    if ticket.status != "sent":
        raise HTTPException(status_code=400, detail="Chỉ ticket đã gửi mới được đánh dấu đã thanh toán")

    ticket.status = "paid"

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=token_data["id"],
        change_type="status_update",
        updated_at=datetime.utcnow(),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status,
        file_path=None
    )
    db.add(version)
    db.flush()

    ticket.version_id = version.id
    db.commit()
    db.refresh(ticket)
    return ticket

@ticket_router.get("/{ticket_id}/pdf")
def get_ticket_pdf(ticket_id: UUID, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket không tồn tại")

    violation = db.query(Violation).filter(Violation.id == ticket.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")

    pdf_file = create_pdf_ticket(ticket, violation)
    return StreamingResponse(io.BytesIO(pdf_file), media_type="application/pdf")

@ticket_router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: UUID, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket không tồn tại")
    return ticket

    
@ticket_router.post("/{ticket_id}/send", response_model=TicketOut)
def send_ticket_email(ticket_id: UUID, db: Session = Depends(get_db), token_data: dict = Depends(verify_access_token)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket không tồn tại")

    violation = db.query(Violation).filter(Violation.id == ticket.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation không tồn tại")

    pdf_file = create_pdf_ticket(ticket, violation)

    ticket.status = "sent"

    html = build_ticket_html(ticket, violation)
    send_email(ticket.email, "Traffic Violation Ticket", html, pdf_file)

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=token_data["id"],
        change_type="send",
        updated_at=datetime.utcnow(),
        amount=ticket.amount,
        name=ticket.name,
        email=ticket.email,
        notes=ticket.notes,
        status=ticket.status,
    )
    db.add(version)
    db.flush()

    ticket.version_id = version.id
    db.commit()
    db.refresh(ticket)
    return ticket
