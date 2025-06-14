from weasyprint import HTML
from backend.api.utils.ticket import build_ticket_html
from backend.storage.models import Ticket, Violation
from backend.storage.database import get_db
from fastapi import HTTPException
from uuid import UUID

# === Thay ticket_id này bằng ID thật trong DB của bạn ===
ticket_id = UUID("d98fceac-b061-489d-aaca-b5c83f9758f8")  # ví dụ: UUID("b0cc76b6-20e2-42dd-9142-4e1bc58fbc1c")

# Lấy phiên làm việc DB
db = next(get_db())

# Lấy dữ liệu ticket
ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
if not ticket:
    raise HTTPException(status_code=404, detail="Ticket not found")
if ticket.status != "pending":
    raise HTTPException(status_code=400, detail=f"Ticket already {ticket.status}")

# Lấy dữ liệu violation
violation = db.query(Violation).filter(Violation.id == ticket.violation_id).first()
if not violation:
    raise HTTPException(status_code=404, detail="Violation not found")

# Gọi hàm tạo HTML
html_content = build_ticket_html(ticket, violation, "Nam Nguyễn")

# Tạo PDF từ HTML
HTML(string=html_content).write_pdf("test_output.pdf")

print("✅ PDF đã được tạo: test_output.pdf")
