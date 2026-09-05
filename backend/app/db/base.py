"""
SQLAlchemy 2.0 Declarative Base configuration for FindNest.
"""
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.
    """
    # Helper to convert model instance to dictionary
    def to_dict(self) -> dict[str, Any]:
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
