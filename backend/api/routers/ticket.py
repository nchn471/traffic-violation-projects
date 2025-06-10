from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from storage.models import Ticket, Violation, Officer
from api.schemas.ticket import TicketCreate, TicketOut
from api.utils.auth import verify_access_token
from storage.database import get_db

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
        status="pending",
        notes=ticket_in.notes
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@ticket_router.post("/{ticket_id}/send", response_model=TicketOut)
def send_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.status != "pending":
        raise HTTPException(status_code=400, detail=f"Ticket already {ticket.status}")

    # Update ticket status
    ticket.status = "sent"
    db.commit()
    db.refresh(ticket)

    # Gửi email ngay (đơn giản)
    officer = db.query(Officer).filter(Officer.id == ticket.officer_id).first()
    violation = db.query(Violation).filter(Violation.id == ticket.violation_id).first()

    if officer and getattr(officer, "email", None):
        subject = "Phiếu phạt giao thông"
        content = f"""
        Xin chào {officer.name},

        Bạn đã ghi nhận một phiếu phạt:
        - Biển số: {violation.license_plate}
        - Vi phạm: {violation.violation_type}
        - Số tiền: {ticket.amount} VNĐ
        - Ghi chú: {ticket.notes or 'Không có'}

        Ngày lập: {ticket.issued_at.strftime('%d/%m/%Y')}
        """
        send_email(to=officer.email, subject=subject, body=content)

    return ticket

def send_email():
    print("Send Email")