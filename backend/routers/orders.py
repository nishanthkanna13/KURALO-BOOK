"""
Orders Router for KURALO BOOK.
Manages customer order placement, order history, and status tracking.
"""
from typing import List, Dict, Any, Optional
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Query
from models.schemas import OrderCreateRequest, OrderResponse, OrderListResponse, OrderItemResponse
from middleware.auth import get_current_user_optional, DEMO_USER
from services.supabase_service import get_supabase, is_demo_mode
from services.demo_data import DEMO_PRODUCTS
from routers.products import _clean_product
from routers.checkout import USER_ADDRESSES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/orders", tags=["Orders"])

# In-memory store for orders
ORDERS_STORE: Dict[str, Dict[str, Any]] = {}


def _get_product_data(prod_id: str) -> Optional[Dict[str, Any]]:
    for p in DEMO_PRODUCTS:
        if p["id"] == prod_id or p["slug"] == prod_id:
            return _clean_product(p)
    return None


@router.post("", response_model=OrderResponse)
async def create_order(
    payload: OrderCreateRequest,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Create a new order after payment / bargaining.
    Saves order details, locks bargained prices, and clears user's active cart.
    """
    uid = user.get("id") if user else "usr-demo-001"
    order_id = f"ord-{uuid.uuid4().hex[:10]}"
    order_number = f"KB-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Find address
    saved_addrs = USER_ADDRESSES.get(uid, USER_ADDRESSES.get("usr-demo-001", []))
    address = next((a for a in saved_addrs if a["id"] == payload.address_id), None)
    if not address and saved_addrs:
        address = saved_addrs[0]

    # Calculate item totals
    order_items = []
    subtotal = 0.0

    for it in payload.items:
        prod = _get_product_data(it.product_id)
        effective_price = it.bargained_price if it.bargained_price is not None else it.unit_price
        total_p = effective_price * it.quantity
        subtotal += total_p

        order_items.append({
            "id": f"ord-item-{uuid.uuid4().hex[:8]}",
            "product_id": it.product_id,
            "product": prod,
            "quantity": it.quantity,
            "unit_price": it.unit_price,
            "bargained_price": it.bargained_price,
            "total_price": total_p
        })

    # Standard shipping calculation
    shipping_fee = 0.0 if subtotal >= 1000.0 else 49.0
    total = subtotal + shipping_fee

    order_record = {
        "id": order_id,
        "order_number": order_number,
        "user_id": uid,
        "status": "confirmed",
        "payment_status": "paid" if payload.payment_id else "pending",
        "items": order_items,
        "address": address,
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "total": total,
        "payment_id": payload.payment_id or f"pay_demo_{uuid.uuid4().hex[:8]}",
        "razorpay_order_id": payload.razorpay_order_id,
        "notes": payload.notes,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    ORDERS_STORE[order_id] = order_record

    # Persist in Supabase if connected
    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                sb.table("orders").insert({
                    "id": order_id,
                    "order_number": order_number,
                    "user_id": uid,
                    "status": order_record["status"],
                    "payment_status": order_record["payment_status"],
                    "subtotal": subtotal,
                    "shipping_fee": shipping_fee,
                    "total": total,
                    "payment_id": order_record["payment_id"],
                    "address_id": payload.address_id,
                }).execute()
            except Exception as e:
                logger.warning(f"Error persisting order to Supabase: {e}")

    return order_record


@router.get("", response_model=OrderListResponse)
async def list_orders(
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """List all orders for the active user."""
    uid = user.get("id") if user else "usr-demo-001"
    user_orders = [o for o in ORDERS_STORE.values() if o["user_id"] == uid]
    user_orders.sort(key=lambda x: x["created_at"], reverse=True)

    total = len(user_orders)
    start = (page - 1) * limit
    paged = user_orders[start : start + limit]

    return {
        "orders": paged,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Get single order details by ID."""
    order = ORDERS_STORE.get(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found"
        )
    return order
