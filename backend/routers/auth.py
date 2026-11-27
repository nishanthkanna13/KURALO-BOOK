"""
Authentication and User Profile Router for KURALO BOOK.
Supports Supabase Auth & instant Demo Login.
"""
from typing import Dict, Any, Optional
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field
from models.schemas import UserProfileResponse, MessageResponse
from middleware.auth import get_current_user_optional, get_current_user, DEMO_USER
from services.supabase_service import get_supabase, is_demo_mode

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    """Register a new customer account."""
    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                res = sb.auth.sign_up({
                    "email": payload.email,
                    "password": payload.password,
                    "options": {
                        "data": {
                            "full_name": payload.full_name,
                            "phone": payload.phone
                        }
                    }
                })
                if res.user:
                    token = res.session.access_token if res.session else f"demo-token-{uuid.uuid4().hex[:16]}"
                    return {
                        "access_token": token,
                        "token_type": "bearer",
                        "user": {
                            "id": str(res.user.id),
                            "email": res.user.email,
                            "full_name": payload.full_name,
                            "phone": payload.phone,
                        }
                    }
            except Exception as e:
                logger.error(f"Supabase registration error: {e}")
                raise HTTPException(status_code=400, detail=str(e))

    # Demo registration fallback
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    return {
        "access_token": f"demo-token-{uuid.uuid4().hex[:16]}",
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": payload.email,
            "full_name": payload.full_name,
            "phone": payload.phone or "+91 98765 43210"
        }
    }


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    """Authenticate customer with email and password."""
    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                res = sb.auth.sign_in_with_password({
                    "email": payload.email,
                    "password": payload.password
                })
                if res.session and res.user:
                    return {
                        "access_token": res.session.access_token,
                        "token_type": "bearer",
                        "user": {
                            "id": str(res.user.id),
                            "email": res.user.email,
                            "full_name": res.user.user_metadata.get("full_name", res.user.email.split("@")[0]),
                            "phone": res.user.phone
                        }
                    }
            except Exception as e:
                logger.warning(f"Supabase login failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

    # Demo mode instant validation
    return {
        "access_token": f"demo-token-{uuid.uuid4().hex[:16]}",
        "token_type": "bearer",
        "user": {
            "id": "usr-demo-001",
            "email": payload.email,
            "full_name": payload.email.split("@")[0].capitalize(),
            "phone": "+91 98765 43210"
        }
    }


@router.post("/demo-login", response_model=AuthResponse)
async def demo_login():
    """One-click instant demo login for seamless evaluation."""
    return {
        "access_token": f"demo-token-{uuid.uuid4().hex[:16]}",
        "token_type": "bearer",
        "user": DEMO_USER
    }


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve profile of the current authenticated user."""
    return {
        "id": user.get("id", "usr-demo-001"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "phone": user.get("phone"),
        "created_at": datetime.utcnow()
    }


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """Logout current user session."""
    return {"message": "Successfully logged out", "success": True}
