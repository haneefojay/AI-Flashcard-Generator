from ..core.config import settings
from groq import AsyncGroq
import json
from typing import Dict, List, Any
from fastapi import HTTPException

import logging

logger = logging.getLogger(__name__)
client = AsyncGroq(api_key=settings.groq_api_key)


async def generate_flashcards_with_groq(
    text: str,
    count: int = 10,
    mode: str = "open_ended",  # "multiple_choice", "true_false", "open_ended"
    difficulty: str = "intermediate",  # "easy", "intermediate", "advanced"
    include_summary: bool = True
) -> Dict[str, Any]:
    """
    Generate AI flashcards with custom mode and difficulty.
    """

    # Truncate text to avoid rate limits (TPM) and context limits
    # 15,000 characters is roughly 3,500-4,000 tokens, safe for Groq's free tier (6k TPM)
    max_chars = 15000
    if len(text) > max_chars:
        logger.warning(f"Text too long ({len(text)} chars), truncating to {max_chars} chars")
        text = text[:max_chars] + "... [Text truncated due to length for processing]"

    base_prompt = f"""
    You are an intelligent flashcard generator.

    Generate exactly {count} {difficulty} flashcards from the following text:

    {text}

    The question mode is: {mode}.
    Return only a JSON object — no explanations, no markdown, no code fences.

    """
    
    # ... (the rest of the prompt logic remains the same)
    if mode == "multiple_choice":
        base_prompt += """
        For each flashcard, generate:
        - "question": the question text
        - "options": a dictionary with keys A, B, C, and D
        - "correct_answer": the correct option key (A, B, C, or D)
        
        Example:
        {
            "cards": [
                {
                    "question": "What is the capital of France?",
                    "options": {
                        "A": "Paris",
                        "B": "Rome",
                        "C": "Berlin",
                        "D": "Madrid"
                    },
                    "correct_answer": "A"
                }
            ]
        }
        """

    elif mode == "true_false":
        base_prompt += """
        For each flashcard, generate:
        - "question": the question text
        - "answer": "True" or "False"
        Example:
        {
            "cards": [
                {"question": "The Earth orbits the Sun.", "answer": "True"}
            ]
        }
        """

    else:  # open_ended
        base_prompt += """
        For each flashcard, generate:
        - "question": a short open-ended question
        - "answer": a brief answer (1-3 sentences)
        """

    if include_summary:
        base_prompt += """
        After generating all flashcards, include a "summary" field that gives a short (2–3 sentence)
        summary of the text or what the flashcards cover.
        Example:
        {
            "cards": [...],
            "summary": "This set of flashcards covers key facts about..."
        }
        """

    try:
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a flashcard generator. Always respond with valid JSON only."},
                {"role": "user", "content": base_prompt},
            ],
            temperature=0.7,
            max_tokens=2000 # Increased max_tokens slightly for larger outputs
        )

        raw_output = response.choices[0].message.content.strip()

        # Handle potential markdown code blocks in the output
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:-3].strip()
        elif raw_output.startswith("```"):
            raw_output = raw_output[3:-3].strip()

        try:
            parsed = json.loads(raw_output)
            return parsed

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {str(e)} | Raw: {raw_output}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse AI response: {str(e)}"
            )

    except Exception as e:
        logger.error(f"Error in generate_flashcards_with_groq: {str(e)}")
        if "context_length_exceeded" in str(e):
             raise HTTPException(
                status_code=413,
                detail="The input text is too long for the AI to process. Please try a smaller file or text snippet."
            )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate flashcards: {str(e)}"
        )
