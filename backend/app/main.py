import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.api import api_router
from app.schemas.health import HealthResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for FindNest - Smart Lost & Found Community Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to FindNest Smart Lost & Found API",
        "docs": "/docs",
        "health": "/api/health"
    }


def check_db_status() -> str:
    try:
        from sqlalchemy import text
        from app.db.session import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return "connected"
    except Exception:
        return "disconnected"


# Direct /api/health endpoint with real database status check
@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health Check",
    description="Returns operational status of the service"
)
async def api_health() -> HealthResponse:
    db_status = check_db_status()
    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        database=db_status
    )


# Mount versioned API routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Ensure static/uploads exists and mount static directory for local uploads
os.makedirs("static/uploads", exist_ok=True)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
