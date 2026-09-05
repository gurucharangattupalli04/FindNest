"""
Authentication API endpoints for FindNest.
Handles user registration, login with JWT issuance, and authenticated profile retrieval.
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User",
    description="Registers a new community member with email, full name, and Argon2-hashed password.",
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Email already registered or invalid input"},
    },
)
def register(
    register_in: RegisterRequest,
    db: Session = Depends(get_db)
) -> User:
    # Normalize email to lower case
    normalized_email = register_in.email.lower().strip()

    # Check for existing user with identical email
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Securely hash password using pwdlib with Argon2
    hashed_password = get_password_hash(register_in.password)

    # Persist new user entity
    new_user = User(
        email=normalized_email,
        full_name=register_in.full_name.strip(),
        phone_number=register_in.phone_number.strip() if register_in.phone_number else None,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates credentials and returns a JWT access token along with user details.",
    responses={
        200: {"description": "Authentication successful"},
        401: {"description": "Invalid email or password"},
        403: {"description": "Account is inactive"},
    },
)
def login(
    login_in: LoginRequest,
    db: Session = Depends(get_db)
) -> TokenResponse:
    normalized_email = login_in.email.lower().strip()

    # Query user by email
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is disabled. Please contact platform support.",
        )

    # Issue signed JWT access token
    token_expiry_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=token_expiry_minutes),
        extra_claims={"email": user.email, "name": user.full_name},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=token_expiry_minutes * 60,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User Profile",
    description="Returns the profile information of the currently authenticated user. Never returns password hashes.",
    responses={
        200: {"description": "Profile retrieved successfully"},
        401: {"description": "Missing, invalid, or expired JWT token"},
    },
)
def get_me(
    current_user: User = Depends(get_current_user)
) -> User:
    return current_user
