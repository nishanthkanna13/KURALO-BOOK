"""
Products and Categories Router for KURALO BOOK.
"""
from typing import Optional, List
import logging
from fastapi import APIRouter, Query, HTTPException, status
from models.schemas import ProductResponse, ProductListResponse, ProductDetailResponse, CategoryResponse
from services.supabase_service import get_supabase, is_demo_mode
from services.demo_data import DEMO_PRODUCTS, DEMO_CATEGORIES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/products", tags=["Products"])


def _clean_product(p: dict) -> dict:
    """Strip server-only confidential fields like min_price."""
    cleaned = dict(p)
    cleaned.pop("min_price", None)
    cleaned.pop("profit_floor", None)
    cleaned.pop("seller_notes", None)
    return cleaned


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories():
    """Return all product categories."""
    if is_demo_mode():
        return DEMO_CATEGORIES

    sb = get_supabase()
    if sb:
        try:
            res = sb.table("categories").select("*").order("name").execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Error fetching categories from DB: {e}")

    return DEMO_CATEGORIES


@router.get("", response_model=ProductListResponse)
async def list_products(
    category: Optional[str] = Query(None, description="Category slug or name"),
    brand: Optional[str] = Query(None, description="Brand name filter"),
    search: Optional[str] = Query(None, description="Search term in name or description"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort: Optional[str] = Query("popular", description="popular | price_asc | price_desc | rating"),
    is_featured: Optional[bool] = Query(None),
    is_trending: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    List products with pagination, search, category filters, and sorting.
    Confidential seller pricing rules are strictly omitted.
    """
    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                q = sb.table("products").select("*", count="exact")
                if category:
                    q = q.or_(f"category.eq.{category},category_id.eq.{category}")
                if brand:
                    q = q.ilike("brand", f"%{brand}%")
                if search:
                    q = q.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
                if min_price is not None:
                    q = q.gte("price", min_price)
                if max_price is not None:
                    q = q.lte("price", max_price)
                if is_featured is not None:
                    q = q.eq("is_featured", is_featured)
                if is_trending is not None:
                    q = q.eq("is_trending", is_trending)

                if sort == "price_asc":
                    q = q.order("price", desc=False)
                elif sort == "price_desc":
                    q = q.order("price", desc=True)
                elif sort == "rating":
                    q = q.order("rating", desc=True)
                else:
                    q = q.order("is_featured", desc=True).order("rating", desc=True)

                offset = (page - 1) * limit
                res = q.range(offset, offset + limit - 1).execute()
                total = res.count or len(res.data)
                cleaned = [_clean_product(p) for p in (res.data or [])]
                total_pages = (total + limit - 1) // limit if total > 0 else 1
                return {
                    "products": cleaned,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "total_pages": total_pages,
                }
            except Exception as e:
                logger.warning(f"Error querying products from DB: {e}")

    # In-memory demo products filtering
    results = [p for p in DEMO_PRODUCTS]

    if category:
        c_lower = category.lower()
        results = [
            p for p in results
            if p.get("category", "").lower() == c_lower or p.get("category_id", "").lower() == c_lower
        ]

    if brand:
        b_lower = brand.lower()
        results = [p for p in results if b_lower in p.get("brand", "").lower()]

    if search:
        s_lower = search.lower()
        results = [
            p for p in results
            if s_lower in p.get("name", "").lower()
            or s_lower in p.get("description", "").lower()
            or any(s_lower in t.lower() for t in p.get("tags", []))
        ]

    if min_price is not None:
        results = [p for p in results if p.get("price", 0) >= min_price]

    if max_price is not None:
        results = [p for p in results if p.get("price", 0) <= max_price]

    if is_featured is not None:
        results = [p for p in results if p.get("is_featured") == is_featured]

    if is_trending is not None:
        results = [p for p in results if p.get("is_trending") == is_trending]

    if sort == "price_asc":
        results.sort(key=lambda x: x.get("price", 0))
    elif sort == "price_desc":
        results.sort(key=lambda x: x.get("price", 0), reverse=True)
    elif sort == "rating":
        results.sort(key=lambda x: x.get("rating", 0), reverse=True)
    else:
        results.sort(key=lambda x: (not x.get("is_featured", False), -x.get("rating", 0)))

    total = len(results)
    start_idx = (page - 1) * limit
    paged_items = results[start_idx : start_idx + limit]
    cleaned = [_clean_product(p) for p in paged_items]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "products": cleaned,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


@router.get("/featured", response_model=List[ProductResponse])
async def get_featured_products(limit: int = 8):
    """Return featured high-visibility products."""
    resp = await list_products(is_featured=True, limit=limit)
    return resp["products"]


@router.get("/trending", response_model=List[ProductResponse])
async def get_trending_products(limit: int = 8):
    """Return trending popular products."""
    resp = await list_products(is_trending=True, limit=limit)
    return resp["products"]


@router.get("/{id_or_slug}", response_model=ProductDetailResponse)
async def get_product_detail(id_or_slug: str):
    """
    Get detailed product by ID or slug with similar products.
    Confidential seller pricing rules are strictly omitted.
    """
    product = None
    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                res = (
                    sb.table("products")
                    .select("*")
                    .or_(f"id.eq.{id_or_slug},slug.eq.{id_or_slug}")
                    .single()
                    .execute()
                )
                if res.data:
                    product = res.data
            except Exception as e:
                logger.warning(f"DB lookup failed for product {id_or_slug}: {e}")

    if not product:
        for p in DEMO_PRODUCTS:
            if p["id"] == id_or_slug or p["slug"] == id_or_slug:
                product = p
                break

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{id_or_slug}' not found"
        )

    # Find similar products (same category, different id)
    cat = product.get("category")
    prod_id = product.get("id")
    similar = [
        _clean_product(p)
        for p in DEMO_PRODUCTS
        if p.get("category") == cat and p.get("id") != prod_id
    ][:4]

    cleaned_product = _clean_product(product)
    cleaned_product["similar_products"] = similar
    return cleaned_product


@router.get("/{id_or_slug}/similar", response_model=List[ProductResponse])
async def get_similar_products(id_or_slug: str, limit: int = 4):
    """Get recommendations similar to a product."""
    detail = await get_product_detail(id_or_slug)
    return detail.get("similar_products", [])[:limit]
