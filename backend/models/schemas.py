"""
Pydantic schemas for KURALO BOOK API request/response models.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator
import uuid


# ─────────────────────────── Category ───────────────────────────

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    icon: Optional[str] = None
    image_url: Optional[str] = None
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ─────────────────────────── Product ────────────────────────────

class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    mrp: float
    discount_percent: Optional[float] = None
    category: Optional[str] = None
    category_id: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = []
    rating: Optional[float] = None
    review_count: Optional[int] = 0
    stock_quantity: Optional[int] = None
    is_featured: Optional[bool] = False
    is_trending: Optional[bool] = False
    specifications: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []
    seller_id: Optional[str] = None
    bargaining_enabled: Optional[bool] = True

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class ProductDetailResponse(ProductResponse):
    similar_products: Optional[List[ProductResponse]] = []


# ─────────────────────────── Cart ───────────────────────────────

class CartItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=10)
    bargained_price: Optional[float] = None
    bargaining_session_id: Optional[str] = None


class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(ge=1, le=10)


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product: Optional[ProductResponse] = None
    quantity: int
    unit_price: float
    bargained_price: Optional[float] = None
    total_price: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: str
    user_id: str
    items: List[CartItemResponse]
    item_count: int
    subtotal: float
    total_savings: float
    total: float


# ─────────────────────────── Bargaining ─────────────────────────

class BargainingStartRequest(BaseModel):
    product_id: str
    language: str = Field(default="en", pattern="^(en|ta|hi)$")


class BargainingStartResponse(BaseModel):
    session_id: str
    product_id: str
    listed_price: float
    greeting_message: str
    language: str
    rounds_remaining: int = 3


class BargainingMessageRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=500)
    offer_price: Optional[float] = None


class BargainingMessageResponse(BaseModel):
    session_id: str
    action: str  # 'counter' | 'accept' | 'reject' | 'max_rounds'
    message: str
    # Only provided on accept/counter — NEVER the seller's minimum_price
    approved_price: Optional[float] = None
    counter_price: Optional[float] = None
    rounds_used: int
    rounds_remaining: int
    is_final: bool = False


class BargainingSessionResponse(BaseModel):
    session_id: str
    product_id: str
    product: Optional[ProductResponse] = None
    status: str  # 'active' | 'accepted' | 'rejected' | 'expired'
    final_price: Optional[float] = None
    rounds_used: int
    created_at: datetime
    messages: List[Dict[str, Any]] = []


# ─────────────────────────── Address ────────────────────────────

class AddressRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=15)
    address_line1: str = Field(min_length=5, max_length=200)
    address_line2: Optional[str] = None
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(min_length=6, max_length=6, pattern="^[1-9][0-9]{5}$")
    country: str = "India"
    is_default: bool = False
    address_type: str = Field(default="home", pattern="^(home|work|other)$")


class AddressResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str
    is_default: bool
    address_type: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────── Orders ─────────────────────────────

class OrderItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)
    unit_price: float
    bargained_price: Optional[float] = None


class OrderCreateRequest(BaseModel):
    items: List[OrderItemRequest]
    address_id: str
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    bargaining_session_ids: Optional[List[str]] = []
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product: Optional[ProductResponse] = None
    quantity: int
    unit_price: float
    bargained_price: Optional[float] = None
    total_price: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    status: str  # 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    payment_status: str  # 'pending' | 'paid' | 'failed' | 'refunded'
    items: List[OrderItemResponse]
    address: Optional[AddressResponse] = None
    subtotal: float
    shipping_fee: float
    total: float
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    limit: int


# ─────────────────────────── Payments ───────────────────────────

class PaymentCreateRequest(BaseModel):
    amount: float  # INR
    currency: str = "INR"
    order_reference: Optional[str] = None  # internal ref


class PaymentCreateResponse(BaseModel):
    razorpay_order_id: str
    amount: int  # in paise
    currency: str
    key_id: str
    is_demo: bool = False


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    internal_order_id: Optional[str] = None


class PaymentVerifyResponse(BaseModel):
    success: bool
    payment_id: str
    message: str


# ─────────────────────────── Wishlist ───────────────────────────

class WishlistItemResponse(BaseModel):
    id: str
    product_id: str
    product: Optional[ProductResponse] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WishlistResponse(BaseModel):
    items: List[WishlistItemResponse]
    total: int


# ─────────────────────────── User Profile ───────────────────────

class UserProfileResponse(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────── Generic ────────────────────────────

class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
