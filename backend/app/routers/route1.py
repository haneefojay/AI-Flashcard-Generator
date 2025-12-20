from fastapi import FastAPI, Depends, APIRouter, HTTPException, status
from ..database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.security import get_current_user
from ..models import User
from .. import schemas

from app.core.utils import hash_password, verify_password

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me", response_model=schemas.UserResponse)
async def get_users(current_user: User = Depends(get_current_user)):
    
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_my_profile(updated_data: schemas.UserUpdate, db: AsyncSession  = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    if updated_data.name is not None:
        current_user.name = updated_data.name
        
    if updated_data.password is not None:
        # Require current password to change password
        if not updated_data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Current password is required to set a new password"
            )
        
        if not verify_password(updated_data.current_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Incorrect current password"
            )
            
        current_user.password = hash_password(updated_data.password)
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    await db.delete(current_user)
    await db.commit()
