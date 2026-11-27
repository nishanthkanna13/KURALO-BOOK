"""
Authentication middleware and dependency for FastAPI.
Supports Supabase JWT verification and Demo mode fallback.
"""
import os
import logging
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from services.supabase_service import get_supabase, is_demo_mode

logger = logging.getLogger(__name__)

DEMO_USER = {
    "id": "usr-demo-001",
    "email": "customer@kuralobook.com",
    "full_name": "Rohan Sharma",
    "phone": "+91 98765 43210",
    "role": "authenticated"
}


async def get_current_user_optional(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication. Returns user dict or None.
    """
    if not authorization:
        return None

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None

    if token.startswith("demo-token") or is_demo_mode():
        return DEMO_USER

    sb = get_supabase()
    if sb is None:
        return DEMO_USER

    try:
        user_res = sb.auth.get_user(token)
        if user_res and user_res.user:
            u = user_res.user
            return {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.user_metadata.get("full_name", u.email.split("@")[0]),
                "phone": u.phone,
                "role": u.role or "authenticated"
            }
    except Exception as e:
        logger.warning(f"Token validation failed: {e}")
        if is_demo_mode():
            return DEMO_USER
        return None

    return None


async def get_current_user(
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Mandatory authentication dependency.
    """
    if not user:
        # If in demo mode without header, provide demo user
        if is_demo_mode():
            return DEMO_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
