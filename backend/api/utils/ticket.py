import os
import smtplib
import tempfile
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from weasyprint import HTML
from dotenv import load_dotenv
from storage.minio_manager import MinIOManager
from datetime import datetime
import cv2

load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

def build_ticket_html(ticket, violation, frame_src, vehicle_src, lp_src, is_pdf=False):
    def image_block(src, caption, cid, max_width):
        if not src:
            return ""
        img_tag = f'<img src="file://{src}" alt="{caption}" style="max-width:{max_width};" />' if is_pdf else \
                  f'<img src="cid:{cid}" alt="{caption}" style="max-width:{max_width};" />'
        return f"""
        <div class="image-container">
          {img_tag}
          <div class="image-caption">{caption}</div>
        </div>
        """

    return f"""
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; font-size: 14px; }}
        h2 {{ text-align: center; font-size: 18px; }}
        table {{ width: 100%; margin-bottom: 20px; }}
        td {{ padding: 8px; }}
        .label {{ font-weight: bold; width: 180px; }}
        .image-container {{ margin-bottom: 24px; text-align: left; }}
        .image-container img {{ display: block; border: 1px solid #ccc; margin-bottom: 6px; }}
        .image-caption {{ font-weight: bold; font-size: 13px; }}
        .footer {{ text-align: center; margin-top: 40px; font-size: 13px; }}
      </style>
    </head>
    <body>
      <h2>BIÊN BẢN VI PHẠM GIAO THÔNG</h2>
      <table>
        <tr><td class="label">Tên người nhận:</td><td>{ticket.name}</td></tr>
        <tr><td class="label">Biển số xe:</td><td>{violation.license_plate}</td></tr>
        <tr><td class="label">Loại phương tiện:</td><td>{violation.vehicle_type}</td></tr>
        <tr><td class="label">Lỗi vi phạm:</td><td>{violation.violation_type}</td></tr>
        <tr><td class="label">Số tiền phạt:</td><td>{ticket.amount:,.0f} VNĐ</td></tr>
        <tr><td class="label">Thời gian vi phạm:</td><td>{violation.timestamp.strftime('%d/%m/%Y %H:%M')}</td></tr>
      </table>

      {image_block(frame_src, "Ảnh vi phạm", "frame", "100%")}
      {image_block(vehicle_src, "Ảnh phương tiện", "vehicle", "65%")}
      {image_block(lp_src, "Ảnh biển số xe", "lp", "65%")}

      <div class="footer">Biên bản được tạo tự động từ hệ thống giám sát giao thông.</div>
    </body>
    </html>
    """
    
def fetch_and_validate_image(mc, path, label):
    if not path:
        print(f"[WARN] Không tìm thấy path cho {label}")
        return None
    try:
        local_path = mc.get_file(path)
        if not os.path.exists(local_path):
            print(f"[WARN] File ảnh {label} không tồn tại: {local_path}")
            return None
        return local_path
    except Exception as e:
        print(f"[ERROR] Không thể tải ảnh {label} từ MinIO: {e}")
        return None


def create_pdf_ticket(ticket, violation) -> bytes:
    mc = MinIOManager()
    frame_path = fetch_and_validate_image(mc, violation.frame_image_path, "khung hình")
    vehicle_path = fetch_and_validate_image(
        mc, violation.vehicle_image_path, "phương tiện"
    )
    lp_path = fetch_and_validate_image(mc, violation.lp_image_path, "biển số")

    temp_files = []

    def write_temp_image(img_path):
        if not img_path:
            return None
        with open(img_path, "rb") as f:
            data = f.read()
        temp_file = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        temp_file.write(data)
        temp_file.flush()
        temp_files.append(temp_file.name)
        return temp_file.name

    frame_tmp = write_temp_image(frame_path)
    vehicle_tmp = write_temp_image(vehicle_path)
    lp_tmp = write_temp_image(lp_path)

    html = build_ticket_html(
        ticket, violation, frame_tmp, vehicle_tmp, lp_tmp, is_pdf=True
    )
    pdf_bytes = HTML(string=html).write_pdf()

    for path in temp_files:
        os.unlink(path)

    return pdf_bytes

def send_email(
    to_email: str,
    subject: str,
    ticket,
    violation,
    attachment: bytes = None,
    filename: str = "ticket.pdf",
):
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        raise RuntimeError("Thiếu thông tin cấu hình email.")
    if not to_email:
        raise ValueError("Chưa cung cấp địa chỉ email người nhận.")

    mc = MinIOManager()
    frame_path = fetch_and_validate_image(mc, violation.frame_image_path, "vi phạm")
    vehicle_path = fetch_and_validate_image(mc, violation.vehicle_image_path, "phương tiện")
    lp_path = fetch_and_validate_image(mc, violation.lp_image_path, "biển số")

    def image_block(src: str, caption: str, width: str):
        if not src:
            return ""
        return f"""
        <div style="margin: 10px 0; text-align: left;">
            <img src="{src}" alt="{caption}" style="width: {width}; display: block; margin-bottom: 5px;" />
            <div style="font-size: 14px; color: #555;">{caption}</div>
        </div>
        """

    # Ghép các ảnh hợp lệ
    image_section = ""
    image_section += image_block("cid:frame", "Ảnh vi phạm", "100%") if frame_path else ""
    image_section += image_block("cid:vehicle", "Ảnh phương tiện", "30%") if vehicle_path else ""
    image_section += image_block("cid:lp", "Ảnh biển số xe", "30%") if lp_path else ""

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>BIÊN BẢN VI PHẠM GIAO THÔNG</h2>
        <p><strong>Tên người nhận:</strong> {ticket.name}</p>
        <p><strong>Biển số xe:</strong> {violation.license_plate}</p>
        <p><strong>Loại phương tiện:</strong> {violation.vehicle_type}</p>
        <p><strong>Lỗi vi phạm:</strong> {violation.violation_type}</p>
        <p><strong>Số tiền phạt:</strong> {ticket.amount:,.0f} VNĐ</p>
        <p><strong>Thời gian vi phạm:</strong> {violation.timestamp.strftime('%d/%m/%Y %H:%M')}</p>

        {'<div style="margin-top: 20px;">' + image_section + '</div>' if image_section else ''}
      </body>
    </html>
    """

    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email

    alt = MIMEMultipart("alternative")
    text_fallback = f"""\
BIÊN BẢN VI PHẠM GIAO THÔNG

Tên người nhận: {ticket.name}
Biển số xe: {violation.license_plate}
Loại phương tiện: {violation.vehicle_type}
Lỗi vi phạm: {violation.violation_type}
Số tiền phạt: {ticket.amount:,.0f} VNĐ
Thời gian vi phạm: {violation.timestamp.strftime('%d/%m/%Y %H:%M')}

Vui lòng mở email trong trình duyệt để xem ảnh và chi tiết biên bản.
"""
    alt.attach(MIMEText(text_fallback, "plain"))
    alt.attach(MIMEText(html_body, "html"))
    msg.attach(alt)

    for cid, path in [
        ("frame", frame_path),
        ("vehicle", vehicle_path),
        ("lp", lp_path),
    ]:
        if not path:
            continue
        with open(path, "rb") as f:
            img = MIMEImage(f.read())
            img.add_header("Content-ID", f"<{cid}>")
            img.add_header("Content-Disposition", "inline", filename=f"{cid}.jpg")
            msg.attach(img)

    if attachment:
        part = MIMEApplication(attachment, Name=filename)
        part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
        msg.attach(part)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
        smtp.send_message(msg)
        print(f"✅ Gửi email thành công tới: {to_email}")
