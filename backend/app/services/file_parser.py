import os
from typing import Optional

import docx
import pdfplumber


def extract_text_from_file(file_path: str) -> Optional[str]:
    """
    Extract text from supported file formats:
    - PDF (.pdf)
    - DOCX (.docx)
    - Markdown (.md)
    - Plain text (.txt)
    """
    ext = os.path.splitext(file_path)[-1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext in [".txt", ".md"]:
        return extract_text_from_text(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


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
