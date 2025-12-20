from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import tempfile
from app.services.file_parser import extract_text_from_file
from app.services.ai_flashcard_generator import generate_flashcards_with_groq
from app import schemas
import os
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional

from ..database import get_db
from ..models import User, Deck, Flashcard
from ..schemas import FlashcardsRequest, FlashcardsResponse, FlashcardResponse
from ..core.security import get_current_user
from typing import List
from uuid import UUID, uuid4

router = APIRouter(
    prefix="/flashcards",
    tags=["Flashcards"]
)

@router.get("/{deck_id}", response_model=List[FlashcardResponse])
async def get_flashcards(
    deck_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all flashcards for a specific deck.
    """
    query = await db.execute(
        select(Flashcard).where(
            Flashcard.deck_id == deck_id,
            Flashcard.user_id == current_user.id
        )
    )
    flashcards = query.scalars().all()
    return flashcards


@router.get("/share/{share_id}", response_model=List[FlashcardResponse])
async def get_shared_flashcards(share_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get flashcards for a shared deck.
    """
    deck = await db.scalar(
        select(Deck).where(
            Deck.shared_link == share_id,
            Deck.is_shared == True
        )
    )
    
    if not deck:
        raise HTTPException(status_code=404, detail="Shared deck not found")
        
    query = await db.execute(
        select(Flashcard).where(Flashcard.deck_id == deck.id)
    )
    flashcards = query.scalars().all()
    return flashcards


@router.post("/generate", response_model=FlashcardsResponse)
async def generate_flashcards(
    request: FlashcardsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        flashcards_data = await generate_flashcards_with_groq(
            text=request.text,
            count=request.count,
            mode=request.question_mode,
            difficulty=request.difficulty,
            include_summary=True
        )

        if not flashcards_data or "cards" not in flashcards_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate flashcards"
            )


        if request.deck_id:
            deck = await db.scalar(
                select(Deck).where(Deck.id == request.deck_id, Deck.user_id == current_user.id)
            )
            if not deck:
                raise HTTPException(status_code=404, detail="Target deck not found")
        else:
            deck_uuid = str(uuid4())[:8]
            deck_name = f"Deck_{datetime.now(timezone.utc).strftime('%Y%m%d')}_{deck_uuid}"
            summary = flashcards_data.get("summary", "")
            
            deck = Deck(
                id=uuid4(),
                name=deck_name,
                summary=summary,
                user_id=current_user.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(deck)
            await db.commit()
            await db.refresh(deck)
        

        for card in flashcards_data["cards"]:
            question = card.get("question")
            answer = card.get("answer")

            if "options" in card and "correct_answer" in card:
                answer = card["correct_answer"]

            new_flashcard = Flashcard(
                id=uuid4(),
                question=question,
                answer=answer,
                options=card.get("options"),
                deck_id=deck.id,
                user_id=current_user.id,
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_flashcard)

        await db.commit()
        return flashcards_data

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and save flashcards: {str(e)}"
        )



@router.post("/upload", response_model=schemas.FlashcardsResponse)
async def upload_file_for_flashcards(
    file: UploadFile = File(...),
    count: int = Form(10),
    question_mode: str = Form("open-ended"),
    difficulty: str = Form("intermediate"),
    deck_id: Optional[UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    """
    Upload a file (PDF, DOCX, TXT, MD) and generate flashcards from its content.
    """
    try:
        suffix = os.path.splitext(file.filename)[-1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        text = extract_text_from_file(tmp_path)
        
        os.unlink(tmp_path)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the file.")
        
        
        try:
            result = await generate_flashcards_with_groq(
                text=text,
                count=count,
                mode=question_mode,
                difficulty=difficulty,
                include_summary=True
            )
        
            if not isinstance(result, dict) or "cards" not in result:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate flashcards"
                )


            if deck_id:
                deck = await db.scalar(
                    select(Deck).where(Deck.id == deck_id, Deck.user_id == current_user.id)
                )
                if not deck:
                    raise HTTPException(status_code=404, detail="Target deck not found")
            else:
                deck_uuid = str(uuid4())[:8]
                deck_name = f"Deck_{datetime.now(timezone.utc).strftime('%Y%m%d')}_{deck_uuid}"
                summary = result.get("summary", "")
                
                deck = Deck(
                    id=uuid4(),
                    name=deck_name,
                    summary=summary,
                    user_id=current_user.id,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(deck)
                await db.commit()
                await db.refresh(deck)
            
            '''
            # Store flashcards in this new deck
            flashcards = []
            for card in result["cards"]:
                new_fc = Flashcard(
                    id=uuid4(),
                    question=card["question"],
                    answer=card["answer"],
                    deck_id=deck.id,
                    user_id=current_user.id,
                    created_at=datetime.now(timezone.utc)                
                )
                db.add(new_fc)
                flashcards.append(new_fc)                
            '''
            for card in result["cards"]:
                question = card.get("question")
                answer = card.get("answer")

                if "options" in card and "correct_answer" in card:
                    answer = card["correct_answer"]

                new_flashcard = Flashcard(
                    id=uuid4(),
                    question=question,
                    answer=answer,
                    options=card.get("options"),
                    deck_id=deck.id,
                    user_id=current_user.id,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(new_flashcard)

            await db.commit()
            return result
        except Exception as e:
            await db.rollback()
            import logging
            logging.getLogger(__name__).error(f"Error in upload_file_for_flashcards: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate and save flashcards: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Unexpected error: {str(e)}"
        )