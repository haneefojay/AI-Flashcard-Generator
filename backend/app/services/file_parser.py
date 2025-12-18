import os
from typing import Optional

import docx
import pdfplumber


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
CHUNK_SIZE = 1024 * 1024  # 1MB chunks for streaming

def extract_text_from_file(file_path: str) -> Optional[str]:
    """
    Extract text from supported file formats with size validation and streaming support.
    
    Supported formats:
    - PDF (.pdf)
    - DOCX (.docx)
    - Markdown (.md)
    - Plain text (.txt)
    
    Args:
        file_path: Path to the file
        
    Returns:
        Extracted text or None if file is empty
        
    Raises:
        ValueError: For unsupported file types or oversized files
        IOError: For file access errors
    """
    # Validate file exists
    if not os.path.exists(file_path):
        raise ValueError(f"File not found: {file_path}")
        
    # Check file size
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        raise ValueError(f"File too large: {file_size/1024/1024:.1f}MB (max {MAX_FILE_SIZE/1024/1024}MB)")
        
    # Get and validate extension
    ext = os.path.splitext(file_path)[-1].lower()
    if ext not in [".pdf", ".docx", ".txt", ".md"]:
        raise ValueError(f"Unsupported file type: {ext}")

    # Extract based on type
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext in [".txt", ".md"]:
        return extract_text_from_text(file_path)
    
    return None  # Shouldn't reach here due to extension validation


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()


def extract_text_from_text(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()
