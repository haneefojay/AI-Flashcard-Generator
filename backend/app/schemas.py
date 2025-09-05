from pydantic import BaseModel
from typing import List

class FlashcardItem(BaseModel):
    question: str
    answer: str

class FlashcardRequest(BaseModel):
    text: str

class FlashcardResponse(BaseModel):
    cards: List[FlashcardItem]
