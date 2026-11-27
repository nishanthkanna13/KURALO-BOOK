"""
Wishlist Router for KURALO BOOK.
"""
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from models.schemas import WishlistResponse, WishlistItemResponse, MessageResponse
from middleware.auth import get_current_user_optional
from services.demo_data import DEMO_PRODUCTS
from routers.products import _clean_product

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

# In-memory wishlist store
USER_WISHLISTS: Dict[str, List[str]] = {
    "usr-demo-001": ["prod-001", "prod-004"]
}


@router.get("", response_model=WishlistResponse)
async def get_wishlist(user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Get all wishlist items for current user."""
    uid = user.get("id") if user else "usr-demo-001"
    prod_ids = USER_WISHLISTS.get(uid, [])

    items = []
    for pid in prod_ids:
        for p in DEMO_PRODUCTS:
            if p["id"] == pid:
                items.append({
                    "id": f"wish-{pid}",
                    "product_id": pid,
                    "product": _clean_product(p),
                    "created_at": datetime.utcnow()
                })
                break

    return {
        "items": items,
        "total": len(items)
    }


@router.post("/{product_id}", response_model=MessageResponse)
async def toggle_wishlist(
    product_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Add or remove a product from the wishlist."""
    uid = user.get("id") if user else "usr-demo-001"
    if uid not in USER_WISHLISTS:
        USER_WISHLISTS[uid] = []

    if product_id in USER_WISHLISTS[uid]:
        USER_WISHLISTS[uid].remove(product_id)
        return {"message": "Removed from wishlist", "success": True}
    else:
        USER_WISHLISTS[uid].append(product_id)
        return {"message": "Added to wishlist", "success": True}
