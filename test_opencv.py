import smtplib
from email.message import EmailMessage
from pathlib import Path

def send_violation_email_with_pdf(
    to_email: str,
    subject: str,
    html_content: str,
    pdf_path: str,
    sender_email: str,
    sender_password: str,
    smtp_server: str = "smtp.gmail.com",
    smtp_port: int = 587,
):
    # Tạo email message
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email

    # Nội dung thuần văn bản (fallback), HTML chính
    msg.set_content("Vui lòng mở email trong trình duyệt để xem nội dung đầy đủ.", subtype="plain")
    msg.add_alternative(html_content, subtype="html")

    # Đính kèm PDF
    pdf_file = Path(pdf_path)
    if pdf_file.exists():
        msg.add_attachment(
            pdf_file.read_bytes(),
            maintype="application",
            subtype="pdf",
            filename=pdf_file.name,
        )
    else:
        raise FileNotFoundError(f"Không tìm thấy file PDF: {pdf_path}")

    # Gửi email
    with smtplib.SMTP(smtp_server, smtp_port) as smtp:
        smtp.starttls()
        smtp.login(sender_email, sender_password)
        smtp.send_message(msg)

    print("📨 Email đã được gửi thành công.")

html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Phiếu xử phạt giao thông</title>
  <style>
    @media only screen and (max-width: 600px) {{
      .container {{
        width: 100% !important;
        padding: 15px !important;
      }}
    }}
    body {{
      background: #f0f2f5;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
    }}
    .container {{
      max-width: 600px;
      margin: 40px auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
    }}
    .header {{
      background: linear-gradient(90deg, #e74c3c, #c0392b);
      color: white;
      padding: 25px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0;
      font-size: 22px;
    }}
    .content {{
      padding: 30px;
      color: #333;
    }}
    .info-block {{
      margin-bottom: 20px;
    }}
    .info-block p {{
      font-size: 16px;
      margin: 6px 0;
    }}
    .highlight {{
      font-weight: bold;
      color: #000;
    }}
    .warning {{
      background-color: #fff3cd;
      color: #856404;
      padding: 15px;
      border-left: 5px solid #ffc107;
      border-radius: 8px;
      margin: 20px 0;
    }}
    .button {{
      display: inline-block;
      background: #27ae60;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 20px;
    }}
    .footer {{
      font-size: 13px;
      color: #888;
      text-align: center;
      padding: 20px;
      background: #f9f9f9;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📸 THÔNG BÁO XỬ PHẠT GIAO THÔNG</h1>
    </div>
    <div class="content">
      <div class="info-block">
        <p>🚗 <span class="highlight">Biển số xe:</span> 30A-123.45</p>
        <p>🕒 <span class="highlight">Thời gian vi phạm:</span> 2025-06-10 14:30</p>
        <p>📍 <span class="highlight">Địa điểm:</span> Ngã tư Trần Duy Hưng - Nguyễn Chí Thanh</p>
        <p>💸 <span class="highlight">Số tiền phạt:</span> 500.000đ</p>
      </div>
      <div class="warning">
        ⚠️ Vui lòng thanh toán trong vòng <strong>7 ngày</strong> kể từ ngày nhận được email này để tránh các hình thức xử lý bổ sung.
      </div>
      <div style="text-align: center;">
        <a href="https://nopphat.gov.vn/thanh-toan" class="button">🔗 Thanh toán ngay</a>
      </div>
    </div>
    <div class="footer">
      Đây là email tự động. Vui lòng không trả lời lại. Nếu có thắc mắc, liên hệ: Phòng CSGT - 0123 456 789
    </div>
  </div>
</body>
</html>
"""


send_violation_email_with_pdf(
    to_email="nchn.work@gmail.com",
    subject="Thông báo xử phạt vi phạm giao thông",
    html_content=html_content,
    pdf_path="CV_NguyenCongHoaiNam.pdf",  # Đường dẫn file PDF
    sender_email="nchn.471@gmail.com",
    sender_password="eiaz zecd ypgk klqk",  # App password nếu dùng Gmail
)
