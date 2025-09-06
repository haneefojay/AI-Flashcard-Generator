from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Flashcard Generator"
    VERSION: str = "0.1.0"
    
    groq_api_key: str
    
    class Config:
        env_file = ".env"

settings = Settings()
