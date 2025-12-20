from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID, uuid4
from app import models, schemas
from sqlalchemy import func
from app.database import get_db
from app.core.security import get_current_user
from app.models import Deck, Flashcard
from app.core.settings import settings


router = APIRouter(prefix="/decks", tags=["Decks"])

@router.post("/", response_model=schemas.DeckResponse)
async def create_deck(deck: schemas.DeckCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    
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
    
        
    query = await db.execute(
        select(models.Deck, func.count(models.Flashcard.id).label("card_count"))
        .outerjoin(models.Flashcard, models.Deck.id == models.Flashcard.deck_id)
        .where(models.Deck.user_id == current_user.id)
        .group_by(models.Deck.id)
        .order_by(models.Deck.created_at.desc())
    )
    results = query.all()
    
    decks = []
    for deck, card_count in results:
        deck_dict = schemas.DeckResponse.model_validate(deck).model_dump()
        deck_dict["card_count"] = card_count
        decks.append(deck_dict)
        
    return decks


@router.get("/{deck_id}", response_model=schemas.DeckResponse)
async def get_deck(
    deck_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    deck = await db.scalar(
        select(models.Deck)
        .where(models.Deck.user_id == current_user.id, models.Deck.id == deck_id)
    )
    
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )
    
    count_query = await db.execute(
        select(func.count(models.Flashcard.id)).where(models.Flashcard.deck_id == deck_id)
    )
    card_count = count_query.scalar() or 0
    
    deck_response = schemas.DeckResponse.model_validate(deck).model_dump()
    deck_response["card_count"] = card_count
    
    return deck_response

@router.put("/{deck_id}", response_model=schemas.DeckResponse)
async def update_deck(
    deck_id: UUID,
    deck_data: schemas.DeckUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
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
    
    count_query = await db.execute(
        select(func.count(models.Flashcard.id)).where(models.Flashcard.deck_id == deck_id)
    )
    card_count = count_query.scalar() or 0
    
    deck_response = schemas.DeckResponse.model_validate(deck).model_dump()
    deck_response["card_count"] = card_count
    
    return deck_response

@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(
    deck_id: UUID, db: AsyncSession = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
    ):
    
    
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
    
    
    deck = await db.scalar(select(models.Deck).where(models.Deck.id == deck_id, models.Deck.user_id == current_user.id))
    
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    
    if not deck.is_shared:
        deck.shared_link=str(uuid4())
        deck.is_shared=True
        db.add(deck)
        await db.commit()
        await db.refresh(deck)
    
    share_url = f"{settings.frontend_url}/share/deck/{deck.shared_link}"
    
    return {"deck_id": deck.id, "share_url": share_url}


@router.get("/share/{share_id}", response_model=schemas.DeckResponse)
async def get_shared_deck(share_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get a shared deck by its share link ID.
    """
    deck = await db.scalar(
        select(models.Deck).where(
            models.Deck.shared_link == share_id,
            models.Deck.is_shared == True
        )
    )
    
    if not deck:
        raise HTTPException(status_code=404, detail="Shared deck not found")
        
    count_query = await db.execute(
        select(func.count(models.Flashcard.id)).where(models.Flashcard.deck_id == deck.id)
    )
    card_count = count_query.scalar() or 0
    
    deck_response = schemas.DeckResponse.model_validate(deck).model_dump()
    deck_response["card_count"] = card_count
    
    return deck_response
