from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from uuid import UUID

from storage.models import Ticket, Violation, TicketVersion
from api.schemas.ticket import TicketCreate, TicketOut, TicketUpdate
from api.utils.auth import verify_access_token
from storage.database import get_db
from api.utils.ticket import build_ticket_html, send_email, create_pdf_ticket, get_pdf_ticket
from datetime import datetime
import json

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

    existing_ticket = db.query(Ticket).filter(Ticket.violation_id == violation_id).first()
    if existing_ticket:
        raise HTTPException(status_code=400, detail="Ticket already exists for this violation")

    officer_id = token_data.get("id")

    new_ticket = Ticket(
        violation_id=violation_id,
        officer_id=officer_id,
        amount=ticket_in.amount,
        email=ticket_in.email,
        name=ticket_in.name,
        notes=ticket_in.notes,
        status="pending",
    )

    file_path = create_pdf_ticket(new_ticket, violation, ticket_in.name)
    new_ticket.file_path = file_path

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket


@ticket_router.get("/{ticket_id}/pdf")
def get_ticket_pdf(ticket_id: UUID, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket or not ticket.file_path:
        raise HTTPException(status_code=404, detail="PDF không tồn tại")

    try:
        url = get_pdf_ticket(ticket.file_path)
        return url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể tạo URL: {e}")


@ticket_router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: UUID, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@ticket_router.patch("/{ticket_id}", response_model=TicketOut)
def patch_ticket(
    ticket_id: UUID,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_access_token)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    before_data = {key: getattr(ticket, key) for key in ticket_in.dict(exclude_unset=True).keys()}

    for key, value in ticket_in.dict(exclude_unset=True).items():
        setattr(ticket, key, value)

    version = TicketVersion(
        ticket_id=ticket.id,
        officer_id=token_data.get("id"),
        change_type="update",
        updated_at=datetime.utcnow(),
        details=json.dumps({
            "before": before_data,
            "after": ticket_in.dict(exclude_unset=True)
        })
    )

    db.add(version)
    db.flush()
    ticket.current_version_id = version.id
    db.commit()
    db.refresh(ticket)
    return ticket


@ticket_router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: UUID, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@ticket_router.post("/{ticket_id}/send")
def send_ticket(ticket_id: UUID, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != "pending":
        raise HTTPException(status_code=400, detail=f"Ticket already {ticket.status}")
    if not ticket.email:
        raise HTTPException(status_code=400, detail="Ticket is missing recipient email")

    violation = db.query(Violation).filter(Violation.id == ticket.violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    html_content = build_ticket_html(ticket, violation)

    try:
        send_email(
            to_email=ticket.email,
            subject="Phiếu xử phạt vi phạm giao thông",
            html_content=html_content,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể gửi email: {e}")

    ticket.status = "sent"
    db.commit()
    db.refresh(ticket)
    return {"message": "Email đã được gửi", "ticket_id": str(ticket.id)}
