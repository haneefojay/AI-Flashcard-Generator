from fastapi import FastAPI, Depends, APIRouter, HTTPException, status
from ..database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.security import get_current_user
from ..models import User
from .. import schemas

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=schemas.UserResponse)
async def get_users(current_user: User = Depends(get_current_user)):
    
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_my_profile(updated_data: schemas.UserUpdate, db: AsyncSession  = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
    
    if updated_data.name is not None:
        current_user.name = updated_data.name
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
    
    await db.delete(current_user)
    await db.commit()
