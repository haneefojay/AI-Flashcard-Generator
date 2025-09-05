from fastapi import APIRouter, HTTPException
from app import schemas

router = APIRouter(
    prefix="/flashcards",
    tags="Flashcards"
)

@router.post("/", response_model=schemas.FlashcardResponse)
async def generate_flashcard(payload: schemas.FlashcardRequest):
    
    return {"cards": [{"question": "Q1", "answer": "A1"}]}