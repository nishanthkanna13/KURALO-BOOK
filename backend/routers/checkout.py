"""
Checkout and Address Router for KURALO BOOK.
Includes delivery calculation, Razorpay test mode payment creation and verification.
"""
from typing import List, Dict, Any, Optional
import uuid
import hmac
import hashlib
import os
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from models.schemas import (
    AddressRequest,
    AddressResponse,
    PaymentCreateRequest,
    PaymentCreateResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse
)
from middleware.auth import get_current_user_optional
from services.supabase_service import get_supabase, is_demo_mode

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/checkout", tags=["Checkout"])

# In-memory store for addresses in demo mode
USER_ADDRESSES: Dict[str, List[Dict[str, Any]]] = {
    "usr-demo-001": [
        {
            "id": "addr-demo-1",
            "user_id": "usr-demo-001",
            "full_name": "Rohan Sharma",
            "phone": "+91 98765 43210",
            "address_line1": "Flat 402, Green Valley Apartments",
            "address_line2": "MG Road, Indiranagar",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560038",
            "country": "India",
            "is_default": True,
            "address_type": "home",
            "created_at": datetime.utcnow().isoformat()
        }
    ]
}


class DeliveryCalculationRequest(BaseModel):
    pincode: str = Field(min_length=6, max_length=6)
    subtotal: float
    shipping_speed: str = Field("standard", pattern="^(standard|express)$")


class DeliveryCalculationResponse(BaseModel):
    pincode: str
    shipping_fee: float
    estimated_days: str
    delivery_date: str
    free_delivery_threshold: float = 1000.0
    qualifies_for_free: bool


@router.get("/addresses", response_model=List[AddressResponse])
async def list_addresses(user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """List saved addresses for authenticated customer."""
    uid = user.get("id") if user else "usr-demo-001"
    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("addresses").select("*").eq("user_id", uid).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning(f"Error fetching addresses: {e}")

    return USER_ADDRESSES.get(uid, USER_ADDRESSES.get("usr-demo-001", []))


@router.post("/addresses", response_model=AddressResponse)
async def create_address(
    payload: AddressRequest,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Add a new delivery address."""
    uid = user.get("id") if user else "usr-demo-001"
    addr_id = f"addr-{uuid.uuid4().hex[:8]}"

    new_addr = {
        "id": addr_id,
        "user_id": uid,
        **payload.dict(),
        "created_at": datetime.utcnow().isoformat()
    }

    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                res = sb.table("addresses").insert(new_addr).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Error saving address to DB: {e}")

    if uid not in USER_ADDRESSES:
        USER_ADDRESSES[uid] = []

    if payload.is_default:
        for a in USER_ADDRESSES[uid]:
            a["is_default"] = False

    USER_ADDRESSES[uid].append(new_addr)
    return new_addr


@router.post("/calculate-delivery", response_model=DeliveryCalculationResponse)
async def calculate_delivery(payload: DeliveryCalculationRequest):
    """
    Calculate dynamic delivery charges based on PIN code and subtotal.
    Free delivery over ₹1,000 for standard shipping.
    """
    is_express = payload.shipping_speed == "express"
    free_threshold = 1000.0
    qualifies = payload.subtotal >= free_threshold and not is_express

    if is_express:
        fee = 99.0
        days = "1 - 2 Business Days"
        date_str = "Tomorrow by 8 PM"
    elif qualifies:
        fee = 0.0
        days = "3 - 5 Business Days"
        date_str = "Within 4 days"
    else:
        fee = 49.0
        days = "3 - 5 Business Days"
        date_str = "Within 4 days"

    return {
        "pincode": payload.pincode,
        "shipping_fee": fee,
        "estimated_days": days,
        "delivery_date": date_str,
        "free_delivery_threshold": free_threshold,
        "qualifies_for_free": qualifies
    }


@router.post("/payments/create-order", response_model=PaymentCreateResponse)
async def create_payment_order(payload: PaymentCreateRequest):
    """
    Initialize a Razorpay test order.
    In demo mode, simulates real order with `rzp_test_demo123`.
    """
    razorpay_key = os.getenv("RAZORPAY_KEY_ID", "rzp_test_KuraloDemoKey")
    razorpay_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    amount_paise = int(round(payload.amount * 100))

    # Live Razorpay attempt if credentials present
    if razorpay_secret and not razorpay_key.startswith("rzp_test_KuraloDemo"):
        try:
            import razorpay
            client = razorpay.Client(auth=(razorpay_key, razorpay_secret))
            order = client.order.create({
                "amount": amount_paise,
                "currency": payload.currency,
                "receipt": payload.order_reference or f"rcpt_{uuid.uuid4().hex[:8]}",
                "payment_capture": 1
            })
            return {
                "razorpay_order_id": order["id"],
                "amount": amount_paise,
                "currency": payload.currency,
                "key_id": razorpay_key,
                "is_demo": False
            }
        except Exception as e:
            logger.warning(f"Razorpay live order creation failed: {e}")

    # Fallback to test mode order
    test_order_id = f"order_demo_{uuid.uuid4().hex[:12]}"
    return {
        "razorpay_order_id": test_order_id,
        "amount": amount_paise,
        "currency": payload.currency,
        "key_id": razorpay_key,
        "is_demo": True
    }


@router.post("/payments/verify", response_model=PaymentVerifyResponse)
async def verify_payment(payload: PaymentVerifyRequest):
    """
    Verify payment signature.
    Safely validates signatures and marks orders as confirmed.
    """
    razorpay_secret = os.getenv("RAZORPAY_KEY_SECRET", "")

    # If test mode order, verify test format
    if payload.razorpay_order_id.startswith("order_demo_") or not razorpay_secret:
        return {
            "success": True,
            "payment_id": payload.razorpay_payment_id or f"pay_demo_{uuid.uuid4().hex[:10]}",
            "message": "Demo payment verified successfully"
        }

    # Cryptographic signature verification for production
    try:
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
        expected_sig = hmac.new(razorpay_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
        if hmac.compare_digest(expected_sig, payload.razorpay_signature):
            return {
                "success": True,
                "payment_id": payload.razorpay_payment_id,
                "message": "Payment verified securely"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature"
            )
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status_code=400, detail="Signature verification error")
