from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from .security import SECRET_KEY, ALGORITHM
from .config import settings

VERIFY_TOKEN_EXPIRE_MINUTES = settings.verify_token_expire_minutes


def create_reset_token(email: str):
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=VERIFY_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None



def create_verification_token(email: str):
    expire = datetime.now(timezone.utc) + timedelta(minutes=VERIFY_TOKEN_EXPIRE_MINUTES)
    data = {"sub": email, "exp": expire}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_verification_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None