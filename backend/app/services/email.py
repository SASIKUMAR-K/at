from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
)

async def send_credentials_email(email: str, name: str, password: str, role: str):
    body = f"""
    <h2>Welcome to Attendance Management System</h2>
    <p>Hello <b>{name}</b>,</p>
    <p>Your account has been created as <b>{role}</b>.</p>
    <p><b>Email:</b> {email}</p>
    <p><b>Password:</b> {password}</p>
    <p>Please login and change your password immediately.</p>
    """
    message = MessageSchema(
        subject="Your Account Credentials - Attendance System",
        recipients=[email],
        body=body,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)
