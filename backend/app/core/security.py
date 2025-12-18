from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from datetime import datetime, timedelta, timezone
from uuid import UUID
from .config import settings
from typing import Any, Dict, Optional, Union
from ..models import User


SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(subject: Dict[str, Any], expires_delta: Optional[timedelta] = None):
    
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {**subject, "exp": int(expire.timestamp())}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        try:
            if not isinstance(user_id, UUID):
                user_id = UUID(user_id)
        except ValueError:
            raise credentials_exception
    
    except JWTError:
        raise credentials_exception

    query = await db.execute(select(User).where(User.id == user_id))
    user = query.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    
    return user
