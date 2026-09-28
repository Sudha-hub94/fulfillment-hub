from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fulfillment Hub"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./fulfillment_hub.db"  # Default to SQLite for development
    
    class Config:
        case_sensitive = True

settings = Settings()