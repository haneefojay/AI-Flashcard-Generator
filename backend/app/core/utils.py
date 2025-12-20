import base64
import bcrypt
import hmac
from typing import Tuple
from fastapi import HTTPException
from app.core.config import settings


ROUNDS = settings.rounds
MIN_PASSWORD_LENGTH = settings.min_password_length

PEPPER = base64.b64decode(settings.auth_pepper)


def _validate_password(password: str) -> None:
    """Validate password meets security requirements."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters long"
        )
    
def _truncate_to_bcrypt_limit(secret: str) -> str:
    """Truncate a string so its UTF-8 encoding is at most 72 bytes.

    Bcrypt operates on the first 72 bytes of the input. To ensure consistent
    behavior across hashing and verification, truncate by bytes and return
    a UTF-8-decoded string (errors ignored for partial bytes).
    """
    b = secret.encode("utf-8")[:72]
    return b.decode("utf-8", errors="ignore")

def _apply_pepper(password: bytes) -> bytes:
    """Apply the pepper to the password using HMAC."""
    return hmac.new(PEPPER, password, 'sha256').digest()


def hash_password(password: str) -> str:
    """Hash a password safely for storage using bcrypt with additional security measures."""
    try:
        _validate_password(password)
        
        safe = _truncate_to_bcrypt_limit(password).encode('utf-8')
        
        peppered = _apply_pepper(safe)
        
        salt = bcrypt.gensalt(rounds=ROUNDS)
        hashed = bcrypt.hashpw(peppered, salt)
        
        return hashed.decode('utf-8')
    except HTTPException:
        raise
    except Exception as e:
        print(f"Password hashing failed: {e}")
        raise HTTPException(
            status_code=400,
            detail="Password hashing failed. Please try a different password."
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored bcrypt hash."""
    try:
        safe = _truncate_to_bcrypt_limit(plain_password).encode('utf-8')
        
        peppered = _apply_pepper(safe)
        
        stored_hash = hashed_password.encode('utf-8')
        
        return bcrypt.checkpw(peppered, stored_hash)
    except Exception:
        return False