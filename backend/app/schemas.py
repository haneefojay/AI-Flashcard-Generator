from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from uuid import UUID


# ---------------------------
# USER SCHEMAS
# ---------------------------

class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "password": "securepassword"
                }
            ]
        }
    }


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    current_password: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    credential: str

class UserResponse(UserBase):
    id: UUID
    is_verified: bool
    created_at: datetime
    has_password: bool
    message: Optional[str] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class UserRegistrationResponse(UserResponse):
    access_token: str
    token_type: str


# ---------------------------
# DECK SCHEMAS
# ---------------------------

class DeckBase(BaseModel):
    name: str
    description: Optional[str] = None


class DeckCreate(DeckBase):
    pass

class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DeckResponse(DeckBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    card_count: int = 0
    summary: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------
# FLASHCARD SCHEMAS
# ---------------------------

class MultipleChoiceOptions(BaseModel):
    A: str
    B: str
    C: str
    D: str


class FlashcardBase(BaseModel):
    question: str
    answer: Optional[str] = None  # For open-ended questions
    options: Optional[MultipleChoiceOptions] = None  # For multiple choice
    correct_answer: Optional[str] = None  # For multiple choice (A, B, C, D)


class FlashcardsRequest(BaseModel):
    text: str
    question_mode: str = "open_ended"  # "multiple_choice", "true_false", "open_ended"
    difficulty: str = "intermediate"  # "easy", "intermediate", "advanced"
    count: Optional[int] = 10
    deck_id: Optional[UUID] = None


class FlashcardsResponse(BaseModel):
    deck_id: Optional[str] = None
    deck_name: Optional[str] = None
    cards: List[FlashcardBase]
    summary: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "deck_id": "123e4567-e89b-12d3-a456-426614174000",
                "deck_name": "History Flashcards",
                "cards": [{
                    "question": "What is the capital of France?",
                    "options": {
                        "A": "Paris",
                        "B": "London",
                        "C": "Berlin",
                        "D": "Madrid"
                    },
                    "correct_answer": "A"
                }],
                "summary": "This set covers basic geography questions."
            }]
        }
    }


class FlashcardCreate(FlashcardBase):
    deck_id: Optional[UUID] = None


class FlashcardResponse(FlashcardBase):
    id: UUID
    deck_id: UUID
    created_at: datetime
    
    model_config = {"from_attributes": True}


# ---------------------------
# AI HISTORY SCHEMAS
# ---------------------------

class AIHistoryBase(BaseModel):
    input_text: str
    model_used: str
    generated_flashcards: int


class AIHistoryCreate(AIHistoryBase):
    pass


class AIHistoryResponse(AIHistoryBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------
# PASSWORD MANAGEMENT
# ---------------------------

class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ForgetPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class DeckShareResponse(BaseModel):
    deck_id: UUID
    share_url: str

class DeckPublicResponse(BaseModel):
    deck_name: str
    description: Optional[str]
    flashcards: list[FlashcardResponse]
