from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app import models, schemas
from app.database import get_db
from app.core.utils import hash_password, verify_password
from app.core.security import create_access_token, get_current_user
from ..core.token_helper import create_reset_token, verify_reset_token, create_verification_token, verify_verification_token
from ..services.mail import send_reset_email, send_verification_email
from datetime import timedelta
from ..core.security import ACCESS_TOKEN_EXPIRE_MINUTES
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth", tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserRegistrationResponse)
async def register_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    email = user.email.lower()
    existing_user = await db.scalar(select(models.User).where(models.User.email == email))
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(name=user.name, email=email, password=hash_password(user.password))
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # send verification email automatically on registration
    token = create_verification_token(email)
    verify_link = f"{settings.frontend_url}/auth/verify-email?token={token}"
    
    try:
        await send_verification_email(email, verify_link)
        message = "User registered successfully. Please check your email for verification."
    except Exception as e:
        # Log the error but don't fail registration
        logger.error(f"Error sending verification email: {str(e)}")
        message = "User registered successfully, but verification email failed to send. You can verify your email later."

    # Generate access token for auto-login
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": str(new_user.id)}, expires_delta=access_token_expires)

    # Attach message and token to response object
    user_data = schemas.UserResponse.model_validate(new_user).model_dump()
    
    return {
        **user_data,
        "access_token": access_token,
        "token_type": "bearer",
        "message": message
    }


@router.post("/login")
async def login_user(form_data: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    email = form_data.email.lower()
    user = await db.scalar(select(models.User).where(models.User.email == email))

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_verified:
        '''
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging inn."
        )
        '''
        pass

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": str(user.id)}, expires_delta=access_token_expires)

    return {"access_token": access_token, "token_type": "bearer"} 


@router.put("/change-password")
async def change_password(
    data: schemas.ChangePassword,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
    ):
    
    if not verify_password(data.current_password, current_user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
    
    current_user.password = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}


@router.post("/forgot-password")
async def forgot_password(data: schemas.ForgetPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.lower()
    user = await db.scalar(select(models.User).where(models.User.email == email))

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    token = create_reset_token(user.email)
    reset_link = f"{settings.frontend_url}/auth/reset-password?token={token}"
    
    try:
        await send_reset_email(user.email, reset_link)
        return {"message": "Password reset email sent!"}
    except Exception as e:
        logger.error(f"Error sending reset email: {str(e)}")
        return {"message": "User found, but password reset email failed to send. Please try again later or contact support."}


@router.post("/reset-password")
async def reset_password(
    data: schemas.ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
    ):
    
    email = verify_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    
    user = await db.scalar(select(models.User).where(models.User.email == email))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.password = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password reset successful"}


@router.post("/send-verification")
async def send_verification(email: str, db: AsyncSession = Depends(get_db)):
    email = email.lower()
    user = await db.scalar(select(models.User).where(models.User.email == email))

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    token = create_verification_token(user.email)
    verify_link = f"{settings.frontend_url}/auth/verify-email?token={token}"
    
    try:
        await send_verification_email(user.email, verify_link)
        return {"message": "Verification email sent successfully"}
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}")
        return {"message": "Email verification could not be sent at this time. Please try again later."}


@router.get("/verify-email", response_class=HTMLResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    
    email = verify_verification_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verificaion token")
    
    user = await db.scalar(select(models.User).where(models.User.email == email))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.is_verified = True
    
    await db.commit()
    
    return HTMLResponse(
        content="<h2>Email verified successfully! You can now log in to account.</h2>"
    )


@router.post("/resend-verification")
async def resend_verification(email: str, db: AsyncSession = Depends(get_db)):
    email = email.lower()
    user = await db.scalar(select(models.User).where(models.User.email == email))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email address."
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified."
        )

    token = create_verification_token(user.email)
    verify_link = f"{settings.frontend_url}/auth/verify-email?token={token}"
    try:
        await send_verification_email(user.email, verify_link)
        return {"message": "Verification email resent successfully"}
    except Exception as e:
        logger.error(f"Error resending verification email: {str(e)}")
        return {"message": "Verification email could not be resent at this time. Please try again later."}