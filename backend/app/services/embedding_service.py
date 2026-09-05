"""
AI Embedding service for FindNest.
Integrates Google Gemini Embedding 2 (`gemini-embedding-2`) using the official `google-genai` SDK.
Generates multimodal embeddings from item metadata (title, category, description,
color, brand, location) and item images (JPG, PNG, WebP).
Ensures safe, non-blocking execution: API failures or missing keys never prevent
item creation or updates.
"""
import logging
import mimetypes
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from sqlalchemy.orm import Session

from app.core.config import settings

logger = logging.getLogger(__name__)

# Placeholder keys that indicate the user hasn't configured a real API key yet
PLACEHOLDER_KEYS = {
    "",
    "your_gemini_api_key_here",
    "placeholder",
    "none",
}


class EmbeddingService:
    def __init__(self):
        self._client = None

    def _get_client(self):
        """Initializes and returns the Google GenAI client if configured."""
        api_key = (settings.GEMINI_API_KEY or "").strip()
        if not api_key or api_key.lower() in PLACEHOLDER_KEYS:
            return None

        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}")
                return None
        return self._client

    def build_text_prompt(self, item: Any) -> str:
        """
        Builds a comprehensive, structured text prompt from item fields.
        Includes title, category, description, color, brand, and location.
        """
        # Resolve category string from enum or string
        category_val = getattr(item, "category", None)
        if hasattr(category_val, "value"):
            category_str = category_val.value
        elif category_val:
            category_str = str(category_val)
        else:
            category_str = "Unspecified"

        lines = [
            f"Title: {item.title}",
            f"Category: {category_str}",
            f"Description: {item.description or 'No description provided'}",
        ]
        if getattr(item, "color", None):
            lines.append(f"Color: {item.color}")
        if getattr(item, "brand", None):
            lines.append(f"Brand: {item.brand}")
        if getattr(item, "location", None):
            lines.append(f"Location: {item.location}")

        return "\n".join(lines)

    def _detect_mime_type(self, content: bytes, filename: str = "") -> str:
        """Detects image MIME type from magic byte signatures or extension."""
        if content.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        elif content.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        elif content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":
            return "image/webp"

        guessed, _ = mimetypes.guess_type(filename)
        if guessed in ("image/jpeg", "image/png", "image/webp"):
            return guessed

        ext = Path(filename).suffix.lower()
        if ext in (".jpg", ".jpeg"):
            return "image/jpeg"
        elif ext == ".png":
            return "image/png"
        elif ext == ".webp":
            return "image/webp"

        return "image/jpeg"

    def load_image_bytes(self, image_url: Optional[str]) -> Optional[Tuple[bytes, str]]:
        """
        Loads image bytes and MIME type from local disk or remote URL.
        Returns (image_bytes, mime_type) or None if not accessible.
        """
        if not image_url or not isinstance(image_url, str) or not image_url.strip():
            return None

        url = image_url.strip()

        # 1. Local filesystem / static uploads
        if not (url.startswith("http://") or url.startswith("https://")):
            clean_path = url.split("?")[0].lstrip("/")
            filename = Path(clean_path).name

            potential_paths = [
                Path(settings.UPLOAD_DIR) / filename,
                Path("backend") / settings.UPLOAD_DIR / filename,
                Path(clean_path),
                Path("backend") / clean_path,
            ]
            for p in potential_paths:
                if p.is_file():
                    try:
                        data = p.read_bytes()
                        mime = self._detect_mime_type(data, filename)
                        return data, mime
                    except Exception as exc:
                        logger.warning(f"Failed to read local image {p}: {exc}")
                        return None
            return None

        # 2. Remote URL (e.g. Firebase Storage, Cloud CDN)
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "FindNest-AI-Agent/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read()
                max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
                if len(data) > max_bytes:
                    logger.warning(f"Remote image exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.")
                    return None
                header_mime = resp.headers.get_content_type()
                mime = header_mime if header_mime in ("image/jpeg", "image/png", "image/webp") else self._detect_mime_type(data, url)
                return data, mime
        except Exception as exc:
            logger.warning(f"Failed to fetch remote image from {url}: {exc}")
            return None

    def build_contents(self, item: Any) -> Tuple[List[Any], bool]:
        """
        Builds the contents list for the Gemini embedding request.
        Combines the text prompt and multimodal image part if present.
        Returns (contents_list, has_image_flag).
        """
        from google.genai import types

        text_prompt = self.build_text_prompt(item)
        contents: List[Any] = [text_prompt]
        has_image = False

        image_url = getattr(item, "image_url", None)
        if image_url:
            image_data = self.load_image_bytes(image_url)
            if image_data:
                data_bytes, mime_type = image_data
                try:
                    image_part = types.Part.from_bytes(data=data_bytes, mime_type=mime_type)
                    contents.append(image_part)
                    has_image = True
                except Exception as exc:
                    logger.warning(f"Failed to create Part from image bytes: {exc}")

        return contents, has_image

    def generate_raw_embedding(self, contents: List[Any]) -> Optional[List[float]]:
        """
        Invokes Gemini Embedding 2 via google-genai SDK.
        Returns vector as list of floats, or None if skipped/failed.
        """
        client = self._get_client()
        if client is None:
            return None

        from google.genai import types

        config = types.EmbedContentConfig(
            output_dimensionality=settings.EMBEDDING_DIMENSIONS,
        )

        response = client.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            contents=contents,
            config=config,
        )

        if response and response.embeddings and len(response.embeddings) > 0:
            first_emb = response.embeddings[0]
            if hasattr(first_emb, "values") and first_emb.values:
                return [float(x) for x in first_emb.values]

        return None

    def generate_item_embedding(self, item: Any) -> Optional[List[float]]:
        """
        Generates and assigns the embedding and ai_metadata on the item instance.
        Gracefully handles missing keys, network errors, and API timeouts.
        Returns the embedding vector or None.
        """
        api_key = (settings.GEMINI_API_KEY or "").strip()
        if not api_key or api_key.lower() in PLACEHOLDER_KEYS:
            logger.info("Gemini API key is not configured. Skipping live embedding generation.")
            item.ai_metadata = {
                "status": "skipped",
                "reason": "GEMINI_API_KEY not configured",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            return None

        try:
            contents, has_image = self.build_contents(item)
            vector = self.generate_raw_embedding(contents)

            if vector:
                item.embedding = vector
                item.ai_metadata = {
                    "model": settings.GEMINI_EMBEDDING_MODEL,
                    "dimensions": len(vector),
                    "has_image": has_image,
                    "has_text": True,
                    "status": "completed",
                    "embedded_at": datetime.now(timezone.utc).isoformat(),
                }
                logger.info(f"Generated {len(vector)}-dim Gemini embedding (has_image={has_image}).")
                return vector
            else:
                item.ai_metadata = {
                    "status": "failed",
                    "error": "Empty embedding response from Gemini API",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                return None
        except Exception as exc:
            logger.warning(f"Error generating Gemini embedding for item: {exc}")
            item.ai_metadata = {
                "status": "failed",
                "error": str(exc),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            return None

    def generate_and_store_embedding(self, db: Session, item: Any) -> Any:
        """
        Computes embedding for an item and immediately commits it to PostgreSQL.
        Safe against any exceptions to prevent breaking item flows.
        """
        try:
            self.generate_item_embedding(item)
            db.add(item)
            db.commit()
            db.refresh(item)
        except Exception as exc:
            logger.warning(f"Error persisting embedding to database: {exc}")
            db.rollback()
        return item


embedding_service = EmbeddingService()
