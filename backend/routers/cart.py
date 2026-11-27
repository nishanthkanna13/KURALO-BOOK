"""
Cart Management Router for KURALO BOOK.
Supports standard prices and locked bargained prices.
"""
from typing import Dict, Any, List, Optional
import uuid
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from models.schemas import CartItemRequest, CartItemUpdateRequest, CartResponse, CartItemResponse
from middleware.auth import get_current_user_optional, DEMO_USER
from services.demo_data import DEMO_PRODUCTS
from routers.products import _clean_product

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cart", tags=["Cart"])

# In-memory cart store per user (fallback & demo)
USER_CARTS: Dict[str, List[Dict[str, Any]]] = {}


def _get_product_data(prod_id: str) -> Optional[Dict[str, Any]]:
    for p in DEMO_PRODUCTS:
        if p["id"] == prod_id or p["slug"] == prod_id:
            return _clean_product(p)
    return None


def _build_cart_response(user_id: str) -> Dict[str, Any]:
    items = USER_CARTS.get(user_id, [])
    item_responses = []
    subtotal = 0.0
    total_savings = 0.0

    for it in items:
        prod = _get_product_data(it["product_id"])
        if not prod:
            continue
        unit_price = float(prod.get("price", 0))
        effective_price = it.get("bargained_price") or unit_price
        qty = it.get("quantity", 1)
        item_total = effective_price * qty
        subtotal += item_total

        # Calculate savings against MRP
        mrp = float(prod.get("mrp", unit_price))
        savings = max(0.0, (mrp - effective_price) * qty)
        total_savings += savings

        item_responses.append({
            "id": it["id"],
            "product_id": it["product_id"],
            "product": prod,
            "quantity": qty,
            "unit_price": unit_price,
            "bargained_price": it.get("bargained_price"),
            "total_price": item_total
        })

    return {
        "id": f"cart-{user_id}",
        "user_id": user_id,
        "items": item_responses,
        "item_count": sum(it["quantity"] for it in item_responses),
        "subtotal": subtotal,
        "total_savings": total_savings,
        "total": subtotal  # shipping added at checkout
    }


@router.get("", response_model=CartResponse)
async def get_cart(user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Retrieve the current user's shopping cart."""
    uid = user.get("id") if user else "guest"
    return _build_cart_response(uid)


@router.post("/items", response_model=CartResponse)
async def add_cart_item(
    payload: CartItemRequest,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Add a product to the cart.
    Accepts bargained_price if customer negotiated with AI assistant.
    """
    uid = user.get("id") if user else "guest"
    prod = _get_product_data(payload.product_id)
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{payload.product_id}' not found"
        )

    if uid not in USER_CARTS:
        USER_CARTS[uid] = []

    # Check if item with same product and price already in cart
    existing = None
    for item in USER_CARTS[uid]:
        if item["product_id"] == payload.product_id:
            # If bargained price matches or both are standard
            if item.get("bargained_price") == payload.bargained_price:
                existing = item
                break

    if existing:
        existing["quantity"] = min(10, existing["quantity"] + payload.quantity)
    else:
        new_item = {
            "id": f"item-{uuid.uuid4().hex[:8]}",
            "product_id": payload.product_id,
            "quantity": payload.quantity,
            "bargained_price": payload.bargained_price,
            "bargaining_session_id": payload.bargaining_session_id
        }
        USER_CARTS[uid].append(new_item)

    return _build_cart_response(uid)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: str,
    payload: CartItemUpdateRequest,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Update item quantity in cart."""
    uid = user.get("id") if user else "guest"
    cart = USER_CARTS.get(uid, [])
    found = False
    for item in cart:
        if item["id"] == item_id:
            item["quantity"] = payload.quantity
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Cart item not found")

    return _build_cart_response(uid)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Remove an item from cart."""
    uid = user.get("id") if user else "guest"
    if uid in USER_CARTS:
        USER_CARTS[uid] = [item for item in USER_CARTS[uid] if item["id"] != item_id]

    return _build_cart_response(uid)


@router.delete("/clear", response_model=CartResponse)
async def clear_cart(user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """Empty cart."""
    uid = user.get("id") if user else "guest"
    USER_CARTS[uid] = []
    return _build_cart_response(uid)
