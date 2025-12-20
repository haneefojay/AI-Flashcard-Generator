from pydantic_settings import BaseSettings
from typing import List, Union

from pydantic import validator

class Settings(BaseSettings):
    project_name: str
    version: str
    backend_cors_origins: List[str] = []
    
    @validator("backend_cors_origins", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    groq_api_key: str    
    
    database_url: str
    
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    
    # Auth pepper for additional password security
    auth_pepper: str
    
    mail_username: str
    mail_password: str
    mail_from: str
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_from_name: str = "FlashAI Support"
    use_credentials: bool = True
    mail_starttls: bool = True
    mail_ssl_tls: bool = False
    mail_suppress_send: bool = False
    frontend_url: str = "http://localhost:3000"
    
    verify_token_expire_minutes: int
    
    rounds: int = 12
    min_password_length: int = 8
    
    

    class Config:
        env_file = ".env"

settings = Settings()

if isinstance(settings.backend_cors_origins, str):
    settings.backend_cors_origins = [
        origin.strip() for origin in settings.backend_cors_origins.split(",")
    ]