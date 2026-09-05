"""
Database session management and engine configuration for FindNest.
Includes automatic IPv4 connection pooler fallback for Supabase and local PostgreSQL fallback.
"""
import logging
import re
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
    primary_uri = settings.SQLALCHEMY_DATABASE_URI.strip().strip('"').strip("'")
    
    # 1. First attempt: primary configured URI
    try:
        eng = create_engine(primary_uri, **engine_kwargs)
        with eng.connect() as conn:
            pass
        logger.info("[Database] Connected successfully using primary connection URI.")
        return eng
    except Exception as exc:
        host_info = primary_uri.split("@")[-1] if "@" in primary_uri else primary_uri
        logger.warning(
            "[Database] Primary connection failed (%s): %s",
            host_info,
            exc,
        )

        # 2. Supabase IPv6 -> IPv4 Pooler Auto-Translation
        # Direct connection (db.<ref>.supabase.co) is IPv6 only.
        # When running on cloud hosts without IPv6 (e.g. Render) or IPv4 local networks,
        # fallback to the AWS IPv4 connection pooler.
        if "db." in primary_uri and ".supabase.co" in primary_uri:
            try:
                ref_match = re.search(r"@db\.([a-z0-9]+)\.supabase\.co", primary_uri)
                if ref_match:
                    proj_ref = ref_match.group(1)
                    pooler_uri = primary_uri.replace(
                        f"@db.{proj_ref}.supabase.co:5432",
                        f"@aws-0-ap-northeast-1.pooler.supabase.com:5432"
                    )
                    # Adjust username to postgres.<ref> required by Supabase poolers
                    if f"postgres.{proj_ref}" not in pooler_uri:
                        pooler_uri = pooler_uri.replace(
                            "postgres:",
                            f"postgres.{proj_ref}:"
                        )
                    logger.info("[Database] Attempting Supabase IPv4 pooler connection (%s)...", pooler_uri.split("@")[-1])
                    eng = create_engine(pooler_uri, **engine_kwargs)
                    with eng.connect() as conn:
                        pass
                    logger.info("[Database] Connected successfully to Supabase via IPv4 pooler!")
                    return eng
            except Exception as pooler_err:
                logger.warning("[Database] Supabase pooler connection failed: %s", pooler_err)

        # 3. Local PostgreSQL fallback (for local development)
        try:
            local_uri = (
                f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@"
                f"{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
            )
            eng = create_engine(local_uri, **engine_kwargs)
            with eng.connect() as conn:
                pass
            logger.info("[Database] Connected to local PostgreSQL.")
            return eng
        except Exception as local_err:
            logger.error("[Database] All database connection attempts failed.")
            raise exc


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
