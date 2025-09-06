from pydantic import BaseModel
from typing import List

class Flashcard(BaseModel):
    question: str
    answer: str

class FlashcardsRequest(BaseModel):
    text: str
    count: int = 10

class FlashcardsResponse(BaseModel):
    cards: List[Flashcard]
