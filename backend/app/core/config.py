"""Application configuration using Pydantic Settings"""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # GCP Configuration
    GCP_PROJECT_ID: str
    GCP_REGION: str = "us-central1"
    VERTEX_AI_LOCATION: str = "us-central1"

    # Gemini Model Configuration
    GEMINI_MODEL: str = "gemini-1.5-pro"

    # Secret Manager
    API_KEY_SECRET_NAME: str = "support-chat-ai-api-key"

    # Firestore
    FIRESTORE_COLLECTION: str = "suggestions"

    # Server Configuration
    PORT: int = 8080
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "info"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Environment
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Global settings instance
settings = Settings()
