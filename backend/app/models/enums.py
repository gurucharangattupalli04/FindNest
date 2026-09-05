"""
Common enumerations for FindNest Lost and Found models.
"""
from enum import Enum


class ItemStatus(str, Enum):
    """Lifecycle status for lost and found items."""
    ACTIVE = "active"
    CLAIMED = "claimed"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class ItemCategory(str, Enum):
    """Categorization for lost and found items matching frontend classification."""
    ELECTRONICS = "electronics"
    WALLETS = "wallets"
    KEYS = "keys"
    BAGS = "bags"
    PETS = "pets"
    ACCESSORIES = "accessories"
    DOCUMENTS = "documents"
    OTHER = "other"
