"""
Pydantic v2 schemas for Smart AI Matching results and explainable score breakdowns.
Guarantees raw embeddings are never exposed in API responses.
"""
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.lost_item import LostItemResponse
from app.schemas.found_item import FoundItemResponse


class MatchConfidence(str, Enum):
    HIGH = "high"       # Score >= 75%
    MEDIUM = "medium"   # Score 50% - 74.99%
    LOW = "low"         # Score 35% - 49.99%


class ScoreBreakdown(BaseModel):
    """Component score breakdown for explainable AI ranking."""
    embedding_similarity: Optional[float] = Field(
        default=None,
        description="Cosine similarity between 768-dim Gemini embeddings (0.0 to 1.0), or None in fallback"
    )
    category_score: float = Field(..., description="Category compatibility score (0.0 to 1.0)")
    location_score: float = Field(..., description="Geographic distance / location string score (0.0 to 1.0)")
    brand_color_score: float = Field(..., description="Combined brand and color similarity score (0.0 to 1.0)")
    temporal_score: float = Field(..., description="Temporal loss/found date alignment score (0.0 to 1.0)")
    is_fallback: bool = Field(
        default=False,
        description="True if fallback weights were used because embeddings were missing/invalid"
    )
    strictly_incompatible: bool = Field(
        default=False,
        description="True if categories were strictly incompatible (triggered 0.2 penalty multiplier)"
    )
    raw_score: float = Field(..., description="Pre-penalty hybrid score (0 to 100)")
    final_score: float = Field(..., description="Final confidence score (0 to 100) after penalties")


class ItemMatchResult(BaseModel):
    """Single candidate match with explainable score and sanitized item payload."""
    matched_item: Union[LostItemResponse, FoundItemResponse, Dict[str, Any]] = Field(
        ...,
        description="Sanitized candidate item data (raw embeddings are strictly omitted)"
    )
    score: float = Field(..., ge=0.0, le=100.0, description="Overall matching score percentage")
    confidence: MatchConfidence = Field(..., description="Confidence tier: high, medium, or low")
    breakdown: ScoreBreakdown = Field(..., description="Detailed feature score breakdown")
    reasons: List[str] = Field(default_factory=list, description="Human-readable match explanation reasons")

    model_config = ConfigDict(from_attributes=True)


class ItemMatchesResponse(BaseModel):
    """Response containing ranked AI matches for a source item."""
    source_item_id: int
    source_item_type: str = Field(..., description="'lost' or 'found'")
    source_item_title: str
    total_candidates_analyzed: int = Field(..., description="Total active opposite items examined")
    matches_count: int = Field(..., description="Number of matches satisfying the >= 35% threshold")
    threshold_applied: float = Field(default=35.0, description="Minimum score threshold (35.0%)")
    matches: List[ItemMatchResult] = Field(default_factory=list, description="Ranked matches list")
