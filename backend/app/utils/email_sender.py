import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

class EmailSender:
    def __init__(self):
        self.smtp_server = os.getenv("EMAIL_HOST", "smtp.example.com")
        self.smtp_port = int(os.getenv("EMAIL_PORT", 587))
        self.smtp_username = os.getenv("EMAIL_USERNAME", "your_email@example.com")
        self.smtp_password = os.getenv("EMAIL_PASSWORD", "your_email_password")
        self.sender_email = os.getenv("EMAIL_FROM_ADDRESS", "noreply@example.com")
        self.use_tls = os.getenv("EMAIL_USE_TLS", "True").lower() == "true"

    def send_verification_email(self, recipient_email: str, otp: str):
        subject = "您的帳戶驗證碼"
        body = f"""
        <html>
        <body>
            <p>您好，</p>
            <p>您的帳戶驗證碼是：<strong>{otp}</strong></p>
            <p>此驗證碼將在 10 分鐘後過期。</p>
            <p>請勿將此驗證碼分享給任何人。</p>
            <p>謝謝！</p>
        </body>
        </html>
        """
        self._send_email(recipient_email, subject, body)

    def send_password_reset_email(self, recipient_email: str, token: str):
        subject = "重設您的密碼"
        # Assuming the frontend URL for password reset is /reset-password
        reset_url = f"http://localhost:5173/reset-password?token={token}"
        body = f"""
        <html>
        <body>
            <p>您好，</p>
            <p>您收到此郵件是因為您（或其他人）要求重設您帳戶的密碼。</p>
            <p>請點擊以下連結來重設您的密碼：</p>
            <p><a href="{reset_url}">{reset_url}</a></p>
            <p>如果您沒有要求重設密碼，請忽略此郵件。</p>
            <p>此連結將在 1 小時後過期。</p>
            <p>謝謝！</p>
        </body>
        </html>
        """
        self._send_email(recipient_email, subject, body)

    def send_appointment_confirmation(self, recipient_email: str, appointment_details: dict):
        subject = "您的預約已確認"
        body = f"""
        <html>
        <body>
            <p>您好，{appointment_details['patient_name']}！</p>
            <p>您的預約已成功確認。以下是您的預約詳細資訊：</p>
            <ul>
                <li><strong>科別:</strong> {appointment_details['department']}</li>
                <li><strong>醫生:</strong> {appointment_details['doctor_name']}</li>
                <li><strong>日期:</strong> {appointment_details['date']}</li>
                <li><strong>時段:</strong> {appointment_details['time_period']}</li>
            </ul>
            <p>提醒您準時就診。</p>
            <p>謝謝！</p>
        </body>
        </html>
        """
        self._send_email(recipient_email, subject, body)

    def _send_email(self, recipient_email: str, subject: str, body: str):
        msg = MIMEMultipart("alternative")
        msg["From"] = self.sender_email
        msg["To"] = recipient_email
        msg["Subject"] = subject

        # Attach HTML body
        msg.attach(MIMEText(body, "html"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            logger.info(f"Verification email sent to {recipient_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {e}")
            raise

email_sender = EmailSender()
