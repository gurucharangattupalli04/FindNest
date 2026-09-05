"""
Database session management and engine configuration for FindNest.
Includes resilient fallback to local PostgreSQL if cloud DNS/IPv6 is unreachable.
"""
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

# Engine configuration with connection pooling and liveness checks
engine_kwargs = {
    "pool_pre_ping": True,
}

# Apply pool size configurations for client-server databases like PostgreSQL
if not settings.SQLALCHEMY_DATABASE_URI.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
    })


def _create_resilient_engine():
    primary_uri = settings.SQLALCHEMY_DATABASE_URI
    try:
        eng = create_engine(primary_uri, **engine_kwargs)
        with eng.connect() as conn:
            pass
        return eng
    except Exception as exc:
        host_info = primary_uri.split("@")[-1] if "@" in primary_uri else primary_uri
        logger.warning(
            "[Database] Primary connection failed (%s). Falling back to local PostgreSQL at 127.0.0.1:5432/findnest. Error: %s",
            host_info,
            exc,
        )
        local_uri = (
            f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@"
            f"{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        )
        return create_engine(local_uri, **engine_kwargs)


engine = _create_resilient_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session per request
    and ensuring proper rollback on error and closure upon completion.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
