from fastapi import APIRouter, UploadFile, File
from app import schemas
import PyPDF2
from docx import Document

router = APIRouter(
    prefix="/flashcards",
    tags=["Generate Flashcards"]
)

# --- Helpers ---
def extract_text_from_pdf(file):
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_text_from_docx(file):
    doc = Document(file)
    return "\n".join([p.text for p in doc.paragraphs])

def extract_text_from_md(file):
    content = file.read().decode("utf-8")
    return content

# --- Routes ---
@router.post("/generate", response_model=schemas.FlashcardResponse)
async def generate_flashcards(request: dict):
    """
    Accept raw text input and return dummy flashcards
    """
    text = request.get("text", "")
    # For now, generate dummy flashcards
    cards = [
        {"question": f"What is the main idea of: {text[:30]}?", "answer": text[:100]}
    ]
    return {"cards": cards}


@router.post("/upload", response_model=schemas.FlashcardResponse)
async def upload_flashcards(file: UploadFile = File(...)):
    """
    Accept PDF, DOCX, or MD file and return dummy flashcards
    """
    extracted_text = ""
    if file.filename.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(file.file)
    elif file.filename.endswith(".docx"):
        extracted_text = extract_text_from_docx(file.file)
    elif file.filename.endswith(".md"):
        extracted_text = extract_text_from_md(file.file)
    else:
        return {"cards": [{"question": "Unsupported file type", "answer": file.filename}]}

    # Dummy flashcards
    cards = [
        {"question": f"What is the main idea of {file.filename}?", "answer": extracted_text[:150]}
    ]
    return {"cards": cards}
