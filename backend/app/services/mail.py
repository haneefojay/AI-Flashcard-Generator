from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings
from jinja2 import Environment, FileSystemLoader
import os
from datetime import datetime


conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_FROM_NAME=settings.mail_from_name,
    MAIL_STARTTLS=settings.mail_starttls,
    MAIL_SSL_TLS=settings.mail_ssl_tls,
    USE_CREDENTIALS=settings.use_credentials,
    SUPPRESS_SEND=settings.mail_suppress_send
)


templates_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
env = Environment(loader=FileSystemLoader(templates_dir))

from typing import Optional
import logging
from redis import asyncio as redis
from email_validator import validate_email, EmailNotValidError

logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT_EMAILS = 5  # Maximum emails per time window
RATE_LIMIT_WINDOW = 3600  # Time window in seconds (1 hour)

async def validate_email_address(email: str) -> bool:
    """Validate email format."""
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False

async def check_rate_limit(email: str, redis_client: Optional[redis.Redis] = None) -> bool:
    """Check if email has exceeded rate limit."""
    if not redis_client:
        return True  # Skip rate limiting if Redis not available
        
    key = f"email_rate_limit:{email}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, RATE_LIMIT_WINDOW)
    return count <= RATE_LIMIT_EMAILS

async def send_reset_email(email_to: str, reset_link: str):
    """
    Send password reset email with rate limiting and validation.
    
    Args:
        email_to: Recipient email address
        reset_link: Password reset link
        
    Raises:
        ValueError: For invalid email
        RuntimeError: For email sending failures
    """
    if not await validate_email_address(email_to):
        raise ValueError(f"Invalid email address: {email_to}")
    
    try:
        template = env.get_template("reset_password.html")
        html_content = template.render(
            reset_link=reset_link,
            year=datetime.now().year
        )
        
        message = MessageSchema(
            subject="Password Reset Request - FlashAI",
            recipients=[email_to],
            body=html_content,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        
        logger.info(f"Reset email sent to {email_to}")
        
    except Exception as e:
        logger.error(f"Failed to send reset email to {email_to}: {str(e)}")
        raise RuntimeError("Failed to send reset email") from e


async def send_verification_email(email_to: str, verify_link: str):
    template = env.get_template("verify_email.html")
    html_content= template.render(
        verify_link=verify_link,
        year=datetime.now().year
    )
    
    message =MessageSchema(
        subject="Verify Your Email - FlashAI",
        recipients=[email_to],
        body=html_content,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)