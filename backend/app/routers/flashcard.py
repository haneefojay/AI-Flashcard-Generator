from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form
import tempfile
from app.services.file_parser import extract_text_from_file
from app.services.ai_generator import generate_flashcards_with_groq
from app import schemas
import os

router = APIRouter(
    prefix="/flashcards",
    tags=["Flashcards"]
)

@router.post("/generate", response_model=schemas.FlashcardsResponse)
def generate_flashcards(request: schemas.FlashcardsRequest):
    try:
        result = generate_flashcards_with_groq(request.text, request.count)
        if not isinstance(result, dict) or "cards" not in result:
            return {"cards": [{"question": "Invalid response format", "answer": str(result)}]}
        return result
    except Exception as e:
        return {"cards": [{"question": "Error generating flashcards", "answer": str(e)}]}


@router.post("/upload", response_model=schemas.FlashcardsResponse)
async def upload_file_for_flashcards(
    file: UploadFile = File(...),
    count: int = Form(10)
):
    """
    Upload a file (PDF, DOCX, TXT, MD) and generate flashcards from its content.
    """
    try:
        # Save file temporarily
        suffix = os.path.splitext(file.filename)[-1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Extract text from file
        text = extract_text_from_file(tmp_path)

        # Clean up temp file
        os.unlink(tmp_path)

        if not text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

        # Generate flashcards using AI
        result = generate_flashcards_with_groq(text, count=count)

        if not isinstance(result, dict) or "cards" not in result:
            raise HTTPException(
                status_code=500,
                detail="Invalid response format from AI generator"
            )
        
        print(f"Received count={count}, file={file.filename}")
        return schemas.FlashcardsResponse(cards=result["cards"])

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to process file: {str(e)}"
        )