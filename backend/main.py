"""
KURALO BOOK — Backend Application
FastAPI REST API Server for AI-Powered Multilingual E-Commerce.
Tagline: "Shop Smart. Speak Your Price."
"""
import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kuralo-book")

# Import Routers
from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.cart import router as cart_router
from routers.bargaining import router as bargaining_router
from routers.checkout import router as checkout_router
from routers.orders import router as orders_router
from routers.wishlist import router as wishlist_router

app = FastAPI(
    title="KURALO BOOK API",
    description=(
        "Next-generation AI-powered e-commerce platform with multilingual "
        "voice and text bargaining (Tamil, English, Hindi). "
        "Seller minimum prices are strictly safeguarded on the server."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(bargaining_router)
app.include_router(checkout_router)
app.include_router(orders_router)
app.include_router(wishlist_router)


@app.get("/", tags=["Health"])
async def root():
    """Service status and quick links."""
    return {
        "app": "KURALO BOOK API",
        "tagline": "Shop Smart. Speak Your Price.",
        "status": "online",
        "version": "1.0.0",
        "languages_supported": ["Tamil (ta)", "English (en)", "Hindi (hi)"],
        "docs": "/docs"
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Detailed health check including environment indicators."""
    supabase_configured = bool(
        os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY")
    )
    openai_configured = bool(os.getenv("OPENAI_API_KEY"))
    razorpay_configured = bool(os.getenv("RAZORPAY_KEY_ID"))

    return {
        "status": "healthy",
        "mode": "live" if supabase_configured else "demo",
        "integrations": {
            "supabase": "connected" if supabase_configured else "demo_mock",
            "openai_llm": "active" if openai_configured else "multilingual_templates",
            "razorpay": "live" if razorpay_configured else "test_sandbox"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."}
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
