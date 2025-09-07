from ..core.config import settings
from groq import Groq
import json

client = Groq(api_key=settings.groq_api_key)
import json

def generate_flashcards_with_groq(text: str, count: int = 10):
    prompt = f"""
    Generate exactly {count} flashcards from the following text:

    {text}

    Return ONLY a JSON object in the following format, with no explanation, no markdown, no code fences:

    {{
        "cards": [
            {{"question": "Question 1", "answer": "Answer 1"}},
            {{"question": "Question 2", "answer": "Answer 2"}},
            {{"question": "Question 3", "answer": "Answer 3"}},
            {{"question": "Question 4", "answer": "Answer 4"}},
            {{"question": "Question 5", "answer": "Answer 5"}}
        ]
    }}
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a flashcard generator. Always respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=800
    )

    raw_output = response.choices[0].message.content.strip()

    try:
        parsed = json.loads(raw_output)
        
        if (
            "cards" in parsed
            and len(parsed["cards"]) == 1
            and isinstance(parsed["cards"][0].get("answer"), dict)
            and "cards" in parsed["cards"][0]["answer"]
        ):
            parsed = {"cards": parsed["cards"][0]["answer"]["cards"]}

        return parsed
    except json.JSONDecodeError:
        return {"cards": [{"question": "Error parsing output", "answer": raw_output}]}
