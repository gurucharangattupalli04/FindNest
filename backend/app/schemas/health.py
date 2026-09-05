from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy", description="Status indicator of the service")
    app_name: str = Field(..., example="FindNest API", description="Service name")
    version: str = Field(..., example="1.0.0", description="Current API version")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Current UTC timestamp"
    )
    database: str = Field(default="unknown", example="connected", description="Database status indicator")
