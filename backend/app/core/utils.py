import base64
import bcrypt
import hmac
from typing import Tuple
from fastapi import HTTPException
from app.core.config import settings


# Security configuration
ROUNDS = settings.rounds  # Work factor for bcrypt
MIN_PASSWORD_LENGTH = settings.min_password_length  # Minimum password length

# Get pepper from environment
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
        # Validate password requirements
        _validate_password(password)
        
        # Truncate and encode the password
        safe = _truncate_to_bcrypt_limit(password).encode('utf-8')
        
        # Apply pepper (adds an additional secret only known to the application)
        peppered = _apply_pepper(safe)
        
        # Generate salt and hash the password
        salt = bcrypt.gensalt(rounds=ROUNDS)
        hashed = bcrypt.hashpw(peppered, salt)
        
        # Return the hash as a string
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
        # Truncate and encode the password
        safe = _truncate_to_bcrypt_limit(plain_password).encode('utf-8')
        
        # Apply pepper (same as in hash_password)
        peppered = _apply_pepper(safe)
        
        # Encode the stored hash
        stored_hash = hashed_password.encode('utf-8')
        
        # Verify the password using constant-time comparison
        return bcrypt.checkpw(peppered, stored_hash)
    except Exception:
        # Don't reveal the nature of the error
        return False