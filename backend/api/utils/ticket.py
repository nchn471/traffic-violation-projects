# utils/ticket.py

import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from weasyprint import HTML
from storage.minio_manager import MinIOManager
import tempfile
load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
API_ENDPOINT = os.getenv("API_ENDPOINT", "http://localhost:8000")


def build_ticket_html(ticket, violation, name):
    return f"""
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: 'Arial', sans-serif;
          margin: 40px;
          font-size: 14px;
          line-height: 1.6;
          color: #000;
        }}
        h2 {{
          text-align: center;
          margin-bottom: 20px;
          font-size: 18px;
          text-transform: uppercase;
        }}
        table {{
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }}
        td {{
          padding: 8px;
          vertical-align: top;
        }}
        .label {{
          font-weight: bold;
          width: 180px;
        }}
        .image-section {{
          margin-top: 30px;
        }}
        .image-container {{
          margin-bottom: 20px;
        }}
        .image-container img {{
            display: block;
            max-width: 90%;
            height: auto;
            border: 1px solid #ccc;
            margin-left: 0;      
        }}
        .image-caption {{
            text-align: left;    
            font-weight: bold;
            margin-top: 8px;
            font-size: 13px;
        }}
        .note {{
          margin-top: 20px;
        }}
        .footer {{
          text-align: center;
          margin-top: 40px;
          font-size: 13px;
          color: #555;
        }}
      </style>
    </head>
    <body>
      <h2>BIÊN BẢN VI PHẠM GIAO THÔNG</h2>

      <table>
        <tr><td class="label">Tên người nhận:</td><td>{name}</td></tr>
        <tr><td class="label">Biển số xe:</td><td>{violation.license_plate}</td></tr>
        <tr><td class="label">Loại phương tiện:</td><td>{violation.vehicle_type}</td></tr>
        <tr><td class="label">Lỗi vi phạm:</td><td>{violation.violation_type}</td></tr>
        <tr><td class="label">Số tiền phạt:</td><td>{ticket.amount:,.0f} VNĐ</td></tr>
        <tr><td class="label">Thời gian vi phạm:</td><td>{violation.timestamp.strftime('%d/%m/%Y %H:%M')}</td></tr>
      </table>

      <div class="image-section">
        <div class="image-container">
          <img src="{API_ENDPOINT}/api/v1/media/{violation.frame_image_path}" alt="Ảnh vi phạm">
          <div class="image-caption">Ảnh vi phạm</div>
        </div>
        <div class="image-container">
          <img src="{API_ENDPOINT}/api/v1/media/{violation.vehicle_image_path}" alt="Ảnh phương tiện">
          <div class="image-caption">Ảnh phương tiện</div>
        </div>
        <div class="image-container">
          <img src="{API_ENDPOINT}/api/v1/media/{violation.lp_image_path}" alt="Ảnh biển số xe">
          <div class="image-caption">Ảnh biển số xe</div>
        </div>
      </div>

      <div class="note">
        <p>Vui lòng thanh toán trong vòng <strong>7 ngày</strong> kể từ ngày nhận được thông báo để tránh các biện pháp xử lý bổ sung theo quy định của pháp luật.</p>
      </div>

      <div class="footer">
        Biên bản được tạo tự động từ hệ thống giám sát giao thông.
      </div>
    </body>
    </html>
    """


def send_email(to_email: str, subject: str, html_content: str):
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        raise RuntimeError("Missing email credentials. Please check your .env file.")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL  
    msg["To"] = to_email
    msg.set_content("Vui lòng mở email trong trình duyệt để xem nội dung đầy đủ.", subtype="plain")
    msg.add_alternative(html_content, subtype="html")

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
            print("Email đã gửi thành công đến:", to_email)
    except Exception as e:
        print("Gửi email thất bại:", e)
        raise

def create_pdf_ticket(ticket, violation, name) -> str:
    html_content = build_ticket_html(ticket, violation, name)

    with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
        HTML(string=html_content).write_pdf(tmp.name)

        minio_path = f"tickets/{ticket.id}.pdf"
        mc = MinIOManager()
        mc.upload_file(tmp.name, minio_path)  

        return minio_path  

def get_pdf_ticket(ticket):
    mc = MinIOManager()
    url = mc.get_presigned_url(ticket.file_path)
    return url
    