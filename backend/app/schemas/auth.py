"""
Pydantic v2 schemas for Authentication requests and responses.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    """User registration payload."""
    email: EmailStr = Field(..., description="Valid email address")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name of user")
    password: str = Field(..., min_length=8, max_length=128, description="Password (minimum 8 characters)")
    phone_number: Optional[str] = Field(default=None, max_length=50, description="Optional phone number")


class LoginRequest(BaseModel):
    """User login credential payload."""
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class TokenResponse(BaseModel):
    """Access token and user profile response returned on successful login."""
    access_token: str = Field(..., description="JWT bearer access token")
    token_type: str = Field(default="bearer", description="Token type (bearer)")
    expires_in: int = Field(..., description="Token validity duration in seconds")
    user: UserResponse = Field(..., description="Basic profile information of authenticated user")


class TokenPayload(BaseModel):
    """Decoded JWT claims."""
    sub: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
