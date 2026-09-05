from fastapi import APIRouter
from app.api.v1.endpoints import health, items, auth, lost_items, found_items, upload, notifications

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(lost_items.router, prefix="/lost-items", tags=["Lost Items"])
api_router.include_router(found_items.router, prefix="/found-items", tags=["Found Items"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
