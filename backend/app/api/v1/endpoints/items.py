"""
Future endpoints for Lost & Found items.
To be connected with database and AI services in future phases.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_items():
    return {"message": "Items endpoint ready for database integration"}
