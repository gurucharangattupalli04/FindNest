"""
Smart AI Matching Service for FindNest.
Implements the 5-factor hybrid scoring engine:
  1. Multimodal Gemini Embedding 2 similarity (50%)
  2. Category compatibility (20%)
  3. Geographic / Location distance (15%)
  4. Brand & Color alignment (10%)
  5. Temporal proximity (5%)

Fallback weights when embeddings are missing:
  Category (40%), Location (30%), Brand+Color (20%), Temporal (10%).

Strict Incompatibility:
  0.2 multiplier applied only for strictly incompatible categories.

Thresholds:
  High >= 75%, Medium 50–74.99%, Low 35–49.99%, below 35% filtered out.
Deterministic tie-breaking on (-score, -id).
"""
import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union
from sqlalchemy.orm import Session

from app.models.enums import ItemCategory, ItemStatus
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.schemas.matching import (
    ItemMatchResult,
    ItemMatchesResponse,
    MatchConfidence,
    ScoreBreakdown,
)

logger = logging.getLogger(__name__)

# Primary hybrid scoring weights (with Gemini embedding)
WEIGHT_EMBEDDING = 0.50
WEIGHT_CATEGORY = 0.20
WEIGHT_LOCATION = 0.15
WEIGHT_BRAND_COLOR = 0.10
WEIGHT_TEMPORAL = 0.05

# Fallback scoring weights (proportional redistribution when embeddings are missing)
FALLBACK_WEIGHT_CATEGORY = 0.40
FALLBACK_WEIGHT_LOCATION = 0.30
FALLBACK_WEIGHT_BRAND_COLOR = 0.20
FALLBACK_WEIGHT_TEMPORAL = 0.10

# Thresholds
THRESHOLD_FILTER = 35.0   # Matches below 35% are filtered out
THRESHOLD_HIGH = 75.0     # Score >= 75%
THRESHOLD_MEDIUM = 50.0   # 50% <= Score < 75%

# Related cross-category pairs that have partial compatibility (not strictly incompatible)
RELATED_CATEGORY_PAIRS = {
    ("accessories", "bags"),
    ("accessories", "wallets"),
    ("accessories", "electronics"),
    ("bags", "wallets"),
    ("documents", "wallets"),
}


class MatchingService:
    @staticmethod
    def cosine_similarity(
        vec1: Optional[List[float]],
        vec2: Optional[List[float]],
    ) -> Optional[float]:
        """
        Computes cosine similarity between two float vectors.
        Returns a float in [0.0, 1.0], or None if vectors are missing/invalid/mismatched.
        """
        if not vec1 or not vec2:
            return None
        if len(vec1) != len(vec2):
            return None

        dot = 0.0
        norm1 = 0.0
        norm2 = 0.0
        for a, b in zip(vec1, vec2):
            fa = float(a)
            fb = float(b)
            dot += fa * fb
            norm1 += fa * fa
            norm2 += fb * fb

        if norm1 <= 0.0 or norm2 <= 0.0:
            return None

        cos = dot / (math.sqrt(norm1) * math.sqrt(norm2))
        # Clamp against floating point inaccuracies and negative cosine
        cos_clamped = max(-1.0, min(1.0, cos))
        return round(max(0.0, cos_clamped), 4)

    @staticmethod
    def haversine_distance_km(
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
    ) -> float:
        """Computes great-circle distance between two GPS coordinates in kilometers."""
        earth_radius_km = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
        return earth_radius_km * c

    def compute_category_score(
        self,
        cat1: Any,
        cat2: Any,
    ) -> Tuple[float, bool, List[str]]:
        """
        Calculates category compatibility score and checks for strict incompatibility.
        Returns (score, is_strictly_incompatible, reasons).
        """
        v1 = cat1.value if hasattr(cat1, "value") else str(cat1).lower()
        v2 = cat2.value if hasattr(cat2, "value") else str(cat2).lower()

        # Exact category match
        if v1 == v2:
            display_name = v1.capitalize()
            return 1.0, False, [f"Exact category match: {display_name}"]

        # Either item is categorized as 'other' -> compatible, partial score
        if v1 == "other" or v2 == "other":
            return 0.5, False, ["Compatible category (unspecified/other)"]

        # Check curated related category pairs
        sorted_pair = (min(v1, v2), max(v1, v2))
        if sorted_pair in RELATED_CATEGORY_PAIRS:
            return 0.4, False, [f"Related categories ({v1} & {v2})"]

        # Distinct, strictly incompatible categories (e.g. electronics vs pets)
        return 0.0, True, []

    def compute_location_score(
        self,
        loc1: str,
        lat1: Optional[float],
        lon1: Optional[float],
        loc2: str,
        lat2: Optional[float],
        lon2: Optional[float],
    ) -> Tuple[float, List[str]]:
        """
        Calculates geographic / text location alignment.
        Combines Haversine GPS distance when coordinates are present and text similarity.
        """
        reasons: List[str] = []
        geo_score: Optional[float] = None

        if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
            dist_km = self.haversine_distance_km(lat1, lon1, lat2, lon2)
            if dist_km <= 1.0:
                geo_score = 1.0
                reasons.append(f"Nearby location (within {dist_km:.1f} km)")
            elif dist_km <= 5.0:
                geo_score = 1.0 - 0.3 * ((dist_km - 1.0) / 4.0)  # 1.0 -> 0.7
                reasons.append(f"Close vicinity ({dist_km:.1f} km)")
            elif dist_km <= 20.0:
                geo_score = 0.7 - 0.4 * ((dist_km - 5.0) / 15.0)  # 0.7 -> 0.3
                reasons.append(f"Same area ({dist_km:.1f} km)")
            elif dist_km <= 50.0:
                geo_score = 0.3 - 0.2 * ((dist_km - 20.0) / 30.0)  # 0.3 -> 0.1
            else:
                geo_score = 0.0

        # Text matching
        text_score = 0.0
        t1 = (loc1 or "").strip().lower()
        t2 = (loc2 or "").strip().lower()

        if t1 and t2:
            if t1 == t2:
                text_score = 1.0
                if not reasons:
                    reasons.append(f"Identical location ('{loc1}')")
            elif t1 in t2 or t2 in t1:
                text_score = 0.85
                if not reasons:
                    reasons.append(f"Matching area ('{loc1}')")
            else:
                # Token intersection
                stop_words = {"the", "in", "at", "near", "floor", "building", "room", "zone", "and", "of"}
                tokens1 = {w for w in t1.replace(",", " ").replace("-", " ").split() if w not in stop_words}
                tokens2 = {w for w in t2.replace(",", " ").replace("-", " ").split() if w not in stop_words}
                if tokens1 and tokens2:
                    overlap = tokens1.intersection(tokens2)
                    if overlap:
                        jaccard = len(overlap) / len(tokens1.union(tokens2))
                        text_score = min(0.75, 0.35 + 0.65 * jaccard)
                        if not reasons:
                            reasons.append(f"Common location keyword ({', '.join(list(overlap)[:2])})")

        if geo_score is not None and text_score > 0:
            final_loc = max(geo_score, text_score)
        elif geo_score is not None:
            final_loc = geo_score
        else:
            final_loc = text_score

        return round(final_loc, 4), reasons

    def compute_brand_color_score(
        self,
        brand1: Optional[str],
        color1: Optional[str],
        brand2: Optional[str],
        color2: Optional[str],
    ) -> Tuple[float, List[str]]:
        """Calculates combined brand and color similarity (50% brand, 50% color)."""
        reasons: List[str] = []

        # 1. Brand Component
        b1 = (brand1 or "").strip().lower()
        b2 = (brand2 or "").strip().lower()
        if b1 and b2:
            if b1 == b2:
                brand_score = 1.0
                reasons.append(f"Matching brand ({brand1})")
            elif b1 in b2 or b2 in b1:
                brand_score = 0.8
                reasons.append(f"Similar brand ({brand1})")
            else:
                brand_score = 0.0
        else:
            brand_score = 0.4  # Neutral score when brand is unspecified

        # 2. Color Component
        c1 = (color1 or "").strip().lower()
        c2 = (color2 or "").strip().lower()
        if c1 and c2:
            if c1 == c2:
                color_score = 1.0
                reasons.append(f"Matching color ({color1})")
            elif c1 in c2 or c2 in c1:
                color_score = 0.8
                reasons.append(f"Similar color tone ({color1})")
            else:
                color_score = 0.0
        else:
            color_score = 0.4  # Neutral score when color is unspecified

        total = 0.5 * brand_score + 0.5 * color_score
        return round(total, 4), reasons

    def compute_temporal_score(
        self,
        date_lost: datetime,
        date_found: datetime,
    ) -> Tuple[float, List[str]]:
        """
        Calculates temporal proximity between loss and discovery dates.
        Normalizes timezones safely.
        """
        reasons: List[str] = []

        # Normalize timezones if one is aware and one is naive
        dl = date_lost if date_lost.tzinfo is not None else date_lost.replace(tzinfo=timezone.utc)
        df = date_found if date_found.tzinfo is not None else date_found.replace(tzinfo=timezone.utc)

        delta_days = (df - dl).total_seconds() / 86400.0

        if delta_days >= 0:
            if delta_days <= 1.0:
                score = 1.0
                reasons.append("Found within 24 hours of loss")
            elif delta_days <= 7.0:
                score = 1.0 - 0.1 * ((delta_days - 1.0) / 6.0)  # 1.0 -> 0.9
                reasons.append(f"Found {max(1, int(round(delta_days)))} days after loss")
            elif delta_days <= 30.0:
                score = 0.9 - 0.4 * ((delta_days - 7.0) / 23.0)  # 0.9 -> 0.5
                reasons.append(f"Dates align within {int(round(delta_days))} days")
            elif delta_days <= 90.0:
                score = 0.5 - 0.3 * ((delta_days - 30.0) / 60.0)  # 0.5 -> 0.2
            else:
                score = 0.1
        else:
            # Item found slightly before loss reported (user reporting timestamp margin)
            abs_delta = abs(delta_days)
            if abs_delta <= 2.0:
                score = 0.7
                reasons.append("Dates match within 2-day margin")
            elif abs_delta <= 7.0:
                score = 0.3
            else:
                score = 0.0

        return round(score, 4), reasons

    def score_pair(
        self,
        lost_item: LostItem,
        found_item: FoundItem,
    ) -> Tuple[float, float, MatchConfidence, ScoreBreakdown, List[str]]:
        """
        Executes the full hybrid scoring engine on a LostItem and FoundItem pair.
        Returns (final_score_pct, raw_score_pct, confidence, breakdown, reasons).
        """
        reasons: List[str] = []

        # 1. Gemini Multimodal Vector Similarity
        emb_sim = self.cosine_similarity(lost_item.embedding, found_item.embedding)
        is_fallback = emb_sim is None

        # 2. Category Score & Strict Incompatibility
        cat_score, is_strictly_incompatible, cat_reasons = self.compute_category_score(
            lost_item.category, found_item.category
        )
        reasons.extend(cat_reasons)

        # 3. Location Score
        loc_score, loc_reasons = self.compute_location_score(
            lost_item.location,
            lost_item.latitude,
            lost_item.longitude,
            found_item.location,
            found_item.latitude,
            found_item.longitude,
        )
        reasons.extend(loc_reasons)

        # 4. Brand & Color Score
        bc_score, bc_reasons = self.compute_brand_color_score(
            lost_item.brand,
            lost_item.color,
            found_item.brand,
            found_item.color,
        )
        reasons.extend(bc_reasons)

        # 5. Temporal Score
        temp_score, temp_reasons = self.compute_temporal_score(
            lost_item.date_lost,
            found_item.date_found,
        )
        reasons.extend(temp_reasons)

        # Add AI embedding reason if available and strong
        if emb_sim is not None:
            if emb_sim >= 0.85:
                reasons.insert(0, f"High AI semantic & visual similarity ({round(emb_sim * 100)}%)")
            elif emb_sim >= 0.65:
                reasons.insert(0, f"Moderate AI semantic match ({round(emb_sim * 100)}%)")

        # Hybrid Weighting
        if not is_fallback:
            raw_score = (
                WEIGHT_EMBEDDING * emb_sim
                + WEIGHT_CATEGORY * cat_score
                + WEIGHT_LOCATION * loc_score
                + WEIGHT_BRAND_COLOR * bc_score
                + WEIGHT_TEMPORAL * temp_score
            )
        else:
            raw_score = (
                FALLBACK_WEIGHT_CATEGORY * cat_score
                + FALLBACK_WEIGHT_LOCATION * loc_score
                + FALLBACK_WEIGHT_BRAND_COLOR * bc_score
                + FALLBACK_WEIGHT_TEMPORAL * temp_score
            )

        # Apply 0.2 penalty multiplier only for strictly incompatible categories
        if is_strictly_incompatible:
            final_score = raw_score * 0.2
            reasons.append("Category strictly incompatible (0.2x penalty applied)")
        else:
            final_score = raw_score

        raw_score_pct = round(raw_score * 100.0, 2)
        final_score_pct = round(final_score * 100.0, 2)

        # Determine confidence tier
        if final_score_pct >= THRESHOLD_HIGH:
            confidence = MatchConfidence.HIGH
        elif final_score_pct >= THRESHOLD_MEDIUM:
            confidence = MatchConfidence.MEDIUM
        else:
            confidence = MatchConfidence.LOW

        breakdown = ScoreBreakdown(
            embedding_similarity=emb_sim,
            category_score=cat_score,
            location_score=loc_score,
            brand_color_score=bc_score,
            temporal_score=temp_score,
            is_fallback=is_fallback,
            strictly_incompatible=is_strictly_incompatible,
            raw_score=raw_score_pct,
            final_score=final_score_pct,
        )

        return final_score_pct, raw_score_pct, confidence, breakdown, reasons

    def find_matches_for_lost_item(
        self,
        db: Session,
        lost_item: LostItem,
        limit: int = 10,
    ) -> ItemMatchesResponse:
        """
        Finds and ranks matching active FoundItems for a specified LostItem.
        Filters matches strictly below 35% threshold.
        Deterministic sort by (-final_score, -found_item.id).
        """
        # Only ACTIVE opposite-type items are considered
        active_found_items = (
            db.query(FoundItem)
            .filter(FoundItem.status == ItemStatus.ACTIVE)
            .all()
        )

        total_analyzed = len(active_found_items)
        scored_matches: List[Tuple[float, int, ItemMatchResult]] = []

        for candidate in active_found_items:
            final_pct, raw_pct, confidence, breakdown, reasons = self.score_pair(
                lost_item, candidate
            )

            # Filter below 35%
            if final_pct >= THRESHOLD_FILTER:
                # Sanitize item: exclude raw embedding vector
                candidate_dict = {
                    "id": candidate.id,
                    "title": candidate.title,
                    "category": candidate.category,
                    "description": candidate.description,
                    "color": candidate.color,
                    "brand": candidate.brand,
                    "location": candidate.location,
                    "storage_location": candidate.storage_location,
                    "latitude": candidate.latitude,
                    "longitude": candidate.longitude,
                    "date_found": candidate.date_found,
                    "contact_name": candidate.contact_name,
                    "contact_phone": candidate.contact_phone,
                    "contact_email": candidate.contact_email,
                    "image_url": candidate.image_url,
                    "status": candidate.status,
                    "is_featured": candidate.is_featured,
                    "user_id": candidate.user_id,
                    "ai_metadata": candidate.ai_metadata,
                    "created_at": candidate.created_at,
                    "updated_at": candidate.updated_at,
                }
                match_result = ItemMatchResult(
                    matched_item=candidate_dict,
                    score=final_pct,
                    confidence=confidence,
                    breakdown=breakdown,
                    reasons=reasons,
                )
                # Sort tuple: (-score, -id) for deterministic ordering
                scored_matches.append((final_pct, candidate.id, match_result))

        # Sort deterministically
        scored_matches.sort(key=lambda x: (-x[0], -x[1]))
        top_matches = [m[2] for m in scored_matches[:limit]]

        return ItemMatchesResponse(
            source_item_id=lost_item.id,
            source_item_type="lost",
            source_item_title=lost_item.title,
            total_candidates_analyzed=total_analyzed,
            matches_count=len(top_matches),
            threshold_applied=THRESHOLD_FILTER,
            matches=top_matches,
        )

    def find_matches_for_found_item(
        self,
        db: Session,
        found_item: FoundItem,
        limit: int = 10,
    ) -> ItemMatchesResponse:
        """
        Finds and ranks matching active LostItems for a specified FoundItem.
        Filters matches strictly below 35% threshold.
        Deterministic sort by (-final_score, -lost_item.id).
        """
        # Only ACTIVE opposite-type items are considered
        active_lost_items = (
            db.query(LostItem)
            .filter(LostItem.status == ItemStatus.ACTIVE)
            .all()
        )

        total_analyzed = len(active_lost_items)
        scored_matches: List[Tuple[float, int, ItemMatchResult]] = []

        for candidate in active_lost_items:
            final_pct, raw_pct, confidence, breakdown, reasons = self.score_pair(
                candidate, found_item
            )

            # Filter below 35%
            if final_pct >= THRESHOLD_FILTER:
                # Sanitize item: exclude raw embedding vector
                candidate_dict = {
                    "id": candidate.id,
                    "title": candidate.title,
                    "category": candidate.category,
                    "description": candidate.description,
                    "color": candidate.color,
                    "brand": candidate.brand,
                    "location": candidate.location,
                    "latitude": candidate.latitude,
                    "longitude": candidate.longitude,
                    "date_lost": candidate.date_lost,
                    "reward": candidate.reward,
                    "contact_name": candidate.contact_name,
                    "contact_phone": candidate.contact_phone,
                    "contact_email": candidate.contact_email,
                    "image_url": candidate.image_url,
                    "status": candidate.status,
                    "is_featured": candidate.is_featured,
                    "user_id": candidate.user_id,
                    "ai_metadata": candidate.ai_metadata,
                    "created_at": candidate.created_at,
                    "updated_at": candidate.updated_at,
                }
                match_result = ItemMatchResult(
                    matched_item=candidate_dict,
                    score=final_pct,
                    confidence=confidence,
                    breakdown=breakdown,
                    reasons=reasons,
                )
                # Sort tuple: (-score, -id) for deterministic ordering
                scored_matches.append((final_pct, candidate.id, match_result))

        # Sort deterministically
        scored_matches.sort(key=lambda x: (-x[0], -x[1]))
        top_matches = [m[2] for m in scored_matches[:limit]]

        return ItemMatchesResponse(
            source_item_id=found_item.id,
            source_item_type="found",
            source_item_title=found_item.title,
            total_candidates_analyzed=total_analyzed,
            matches_count=len(top_matches),
            threshold_applied=THRESHOLD_FILTER,
            matches=top_matches,
        )


matching_service = MatchingService()
