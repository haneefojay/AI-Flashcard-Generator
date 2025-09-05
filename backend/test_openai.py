import os
from openai import OpenAI
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get API key from environment variable
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY not set in .env")

client = OpenAI(api_key=api_key)

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # light + fast model
        messages=[{"role": "user", "content": "Hello, can you confirm my API key works?"}],
        max_tokens=20
    )
    print("✅ API Key works!")
    print("Response:", response.choices[0].message.content)
except Exception as e:
    print("❌ API Key test failed:", e)
