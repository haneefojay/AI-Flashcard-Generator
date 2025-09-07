from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    project_name: str
    version: str
    backend_cors_origin: List[str] = []
    
    groq_api_key: str
    
    class Config:
        env_file = ".env"

settings = Settings()

if isinstance(settings.backend_cors_origin, str):
    settings.backend_cors_origin = [
        origin.strip() for origin in settings.backend_cors_origin.split(",")
    ]