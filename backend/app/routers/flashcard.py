from fastapi import APIRouter, UploadFile, File, Form
import tempfile
from app.services.file_parser import extract_text_from_file
from app.services.ai_generator import generate_flashcards_from_text

router = APIRouter()

@router.post("/flashcards/generate")
async def generate_flashcards(text: str = Form(...)):
    cards = generate_flashcards_from_text(text)
    return {"cards": cards}

@router.post("/flashcards/upload")
async def upload_file(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    text = extract_text_from_file(tmp_path)
    cards = generate_flashcards_from_text(text)
    return {"cards": cards}
