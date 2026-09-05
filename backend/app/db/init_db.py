"""
Database initialization and table creation helper.
"""
import logging
from sqlalchemy.engine import Engine
from app.db.base import Base
from app.db.session import engine

logger = logging.getLogger(__name__)


def init_db(bind: Engine = None) -> None:
    """
    Initializes database tables defined in SQLAlchemy models.
    Imports models to ensure their registration with Base.metadata before creation.
    """
    # Import all models so that Base.metadata knows about them
    from app.models.user import User  # noqa: F401
    from app.models.lost_item import LostItem  # noqa: F401
    from app.models.found_item import FoundItem  # noqa: F401
    from app.models.notification import Notification  # noqa: F401

    target_engine = bind or engine
    logger.info("Creating database tables using engine: %s", target_engine.url)
    Base.metadata.create_all(bind=target_engine)
    logger.info("Database tables created successfully.")
