import json
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FindNest API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            trimmed = v.strip()
            if trimmed.startswith("["):
                try:
                    return json.loads(trimmed)
                except Exception:
                    pass
            return [origin.strip() for origin in trimmed.split(",") if origin.strip()]
        return v

    # Database Configuration (PostgreSQL)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "findnest"
    
    # Direct Database URL (takes precedence if specified)
    DATABASE_URL: Optional[str] = None

    # Connection Pool Settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Authentication & JWT Configuration
    JWT_SECRET_KEY: str = "findnest-default-secret-key-min-32-bytes-change-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Firebase Storage & Image Upload Settings
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    MAX_UPLOAD_SIZE_MB: int = 5
    UPLOAD_DIR: str = "static/uploads"
    SERVER_HOST: str = "http://127.0.0.1:8000"

    # Gemini AI & Embedding Settings (Step 7)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-2"
    EMBEDDING_DIMENSIONS: int = 768

    # Smart Match Notification & Email Settings (Step 10)
    NOTIFICATION_MATCH_THRESHOLD: float = 75.0  # Only notify on high confidence matches (>= 75%)
    EMAIL_ENABLED: bool = False
    EMAIL_PROVIDER: str = "console"  # "console", "resend", or "smtp"
    EMAIL_FROM: str = "FindNest Alerts <notifications@findnest.local>"
    RESEND_API_KEY: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """
        Returns the SQLAlchemy connection URI.
        Normalizes postgres:// -> postgresql:// for SQLAlchemy 2.0 compatibility.
        """
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
