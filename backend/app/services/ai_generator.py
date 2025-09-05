from typing import Optional, List, Dict
from openai import OpenAI
import json
from ..core.config import settings

client = OpenAI(api_key=settings.openai_api_key)

def generate_flashcards_from_text(text: str, num_cards: int = 5) -> List[Dict[str, str]]:
    prompt =f"""
    Create {num_cards} flashcards (question and answer) from the following text:
    
    {text}
    
    Format response as JSON list of objects:
    [
        {{"question": "...", "answer": "..."}},
        ...
    ]
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        
        content = response.choices[0].message.content.strip()
        
        cards = json.loads(content)
        return cards
    
    except Exception as e:
        return [
            {"question": "Error generating flashcards", "answer": str(e)}
        ]