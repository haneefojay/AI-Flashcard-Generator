from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID, uuid4
from app import models, schemas
from app.database import get_db
from app.core.security import get_current_user


router = APIRouter(prefix="/decks", tags=["Decks"])

@router.post("/", response_model=schemas.DeckResponse)
async def create_deck(deck: schemas.DeckCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
    
    new_deck = models.Deck(
        name=deck.name,
        description=deck.description,
        user_id=current_user.id,
    )
    db.add(new_deck)
    await db.commit()
    await db.refresh(new_deck)
    return new_deck

@router.get("/", response_model=list[schemas.DeckResponse])
async def get_user_decks(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
        
    query = await db.execute(select(models.Deck).where(models.Deck.user_id == current_user.id))
    decks = query.scalars().all()
    return decks


@router.get("/{deck_id}", response_model=schemas.DeckResponse)
async def get_deck(
    deck_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
    
    deck = await db.scalar(select(models.Deck).where(
        models.Deck.user_id == current_user.id,
        models.Deck.id == deck_id
    ))
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )
    
    return deck

@router.put("/{deck_id}", response_model=schemas.DeckResponse)
async def update_deck(
    deck_id: UUID,
    deck_data: schemas.DeckUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
    
    deck = await db.scalar(select(models.Deck).where(
        models.Deck.user_id == current_user.id,
        models.Deck.id == deck_id
    ))
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )
    
    for field, value in deck_data.model_dump(exclude_unset=True).items():
        setattr(deck, field, value)
    
    await db.commit()
    await db.refresh(deck)
    return deck

@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(
    deck_id: UUID, db: AsyncSession = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
    ):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
    
    deck = await db.scalar(select(models.Deck).where(models.Deck.user_id == current_user.id, models.Deck.id == deck_id))
    
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    
    await db.delete(deck)
    await db .commit()


@router.post("/{deck_id}/share", response_model=schemas.DeckShareResponse)
async def share_deck(
    deck_id: UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
    ):
    
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for premium users"
        )
    
    deck = await db.scalar(select(models.Deck).where(models.Deck.id == deck_id, models.Deck.user_id == current_user.id))
    
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    
    if not deck.is_shared:
        deck.shared_link=str(uuid4())
        deck.is_shared=True
        db.add(deck)
        await db.commit()
        await db.refresh(deck)
    
    share_url = f"https://flashai.app/share/deck/{deck.shared_link}"
    
    return {"deck_id": deck.id, "share_url": share_url}
