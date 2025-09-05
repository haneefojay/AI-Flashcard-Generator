from pydantic import BaseModel
from typing import List

class Flashcard(BaseModel):
    question: str
    answer: str

class GenerateFlashcardsRequest(BaseModel):
    text: str

class GenerateFlashcardsResponse(BaseModel):
    cards: List[Flashcard]
