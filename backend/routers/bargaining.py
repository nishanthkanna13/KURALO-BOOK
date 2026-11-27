"""
AI Voice & Text Bargaining Router for KURALO BOOK.
Strict Server-Side Price Security:
- Minimum acceptable price and profit floor are strictly confidential.
- The client and frontend LLM are never provided seller min prices.
- All counteroffers are strictly computed and verified on the server.
- Maximum 3 negotiation rounds.
"""
from typing import Optional, Dict, Any, List
import uuid
import re
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from models.schemas import (
    BargainingStartRequest,
    BargainingStartResponse,
    BargainingMessageRequest,
    BargainingMessageResponse,
    BargainingSessionResponse,
    ProductResponse
)
from services.pricing_service import pricing_service
from services.ai_service import AIService
from services.supabase_service import get_supabase, is_demo_mode
from services.demo_data import DEMO_PRODUCTS
from middleware.auth import get_current_user_optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/bargain", tags=["Bargaining"])
ai_service = AIService()

# In-memory storage for active bargaining sessions
# (allows full capability in demo mode and rapid response)
SESSIONS: Dict[str, Dict[str, Any]] = {}


def _extract_offer_from_text(text: str) -> Optional[float]:
    """
    Robust regex extractor for customer price mentions:
    e.g. '1500', '₹1500', 'rs 1500', '1,500 rupees', 'give it for 1200'
    """
    # Clean text
    clean_text = text.replace(",", "")
    match = re.search(r'(?:(?:₹|rs\.?|inr|rupees?)\s*(\d+(?:\.\d+)?))|(\d+(?:\.\d+)?)\s*(?:(?:₹|rs\.?|inr|rupees?))|(\b\d{2,6}\b)', clean_text, re.IGNORECASE)
    if match:
        for group in match.groups():
            if group:
                try:
                    val = float(group)
                    if 10 <= val <= 1000000:
                        return val
                except ValueError:
                    pass
    return None


def _get_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    for p in DEMO_PRODUCTS:
        if p["id"] == product_id or p["slug"] == product_id:
            return p
    return None


@router.post("/start", response_model=BargainingStartResponse)
async def start_bargaining(
    payload: BargainingStartRequest,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Initiate an AI bargaining session for a product.
    Generates personalized welcome message in Tamil, Hindi, or English.
    """
    product = _get_product_by_id(payload.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{payload.product_id}' not found"
        )

    session_id = f"bargain-{uuid.uuid4().hex[:12]}"
    lang = payload.language if payload.language in ("en", "ta", "hi") else "en"
    listed_price = float(product["price"])

    # Build greeting based on selected language
    if lang == "ta":
        greeting = f"வணக்கம்! KURALO BOOK-க்கு வரவேற்கிறோம் 🛍️ நீங்கள் '{product['name']}' தேர்ந்தெடுத்துள்ளீர்கள். இதன் நிர்ணயிக்கப்பட்ட விலை ₹{int(listed_price)}. நீங்கள் விலையை பேரம் பேச விரும்புகிறீர்களா?"
    elif lang == "hi":
        greeting = f"नमस्ते! KURALO BOOK में आपका स्वागत है 🛍️ आपने '{product['name']}' चुना है। इसकी वर्तमान कीमत ₹{int(listed_price)} है। क्या आप कीमत पर बातचीत करना चाहते हैं?"
    else:
        greeting = f"Hello! Welcome to KURALO BOOK 🛍️ You selected '{product['name']}'. The listed price is ₹{int(listed_price)}. Would you like to negotiate the price?"

    session_data = {
        "session_id": session_id,
        "product_id": payload.product_id,
        "product_name": product["name"],
        "listed_price": listed_price,
        "language": lang,
        "user_id": user.get("id") if user else "guest",
        "rounds_used": 0,
        "max_rounds": 3,
        "status": "active",
        "current_approved_price": None,
        "messages": [
            {
                "sender": "assistant",
                "text": greeting,
                "timestamp": datetime.utcnow().isoformat(),
                "action": "greeting"
            }
        ],
        "created_at": datetime.utcnow().isoformat()
    }

    SESSIONS[session_id] = session_data

    # Also record in Supabase if live
    if not is_demo_mode():
        sb = get_supabase()
        if sb:
            try:
                sb.table("bargaining_sessions").insert({
                    "id": session_id,
                    "user_id": user.get("id") if user else None,
                    "product_id": payload.product_id,
                    "listed_price": listed_price,
                    "status": "active",
                    "rounds_used": 0,
                    "language": lang,
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to persist session to Supabase: {e}")

    return {
        "session_id": session_id,
        "product_id": payload.product_id,
        "listed_price": listed_price,
        "greeting_message": greeting,
        "language": lang,
        "rounds_remaining": 3
    }


@router.post("/message", response_model=BargainingMessageResponse)
async def submit_bargaining_message(payload: BargainingMessageRequest):
    """
    Process customer voice or text message.
    Confidential seller pricing floor is verified entirely on backend.
    Client never receives minimum acceptable price.
    """
    session = SESSIONS.get(payload.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active bargaining session not found or expired."
        )

    if session["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This bargaining session is already {session['status']}."
        )

    # Detect customer's offer from explicit field or natural language
    customer_offer = payload.offer_price
    if customer_offer is None:
        customer_offer = _extract_offer_from_text(payload.message)

    # Check for acceptance phrases (e.g., 'okay', 'deal', 'i accept', 'done', 'சரி', 'ठीक है')
    lower_msg = payload.message.lower().strip()
    accept_tokens = [
        "okay", "ok", "yes", "deal", "accept", "i agree", "agree", "done", "book it", "buy it",
        "சரி", "ஒப்பந்தம்", "வாங்கலாம்",
        "हाँ", "हां", "ठीक है", "मंजूर है", "डील मंजूर", "डन"
    ]
    is_acceptance = any(token in lower_msg for token in accept_tokens)

    # If customer says 'ok' to an already given counteroffer
    if is_acceptance and session["current_approved_price"] is not None:
        approved = session["current_approved_price"]
        session["status"] = "accepted"
        lang = session["language"]

        if lang == "ta":
            resp_text = f"🎉 அருமை! ₹{int(approved)} விலையில் ஒப்பந்தம் முடிந்தது! உங்கள் ஆர்டரை முடிக்க தொடர்வோம்."
        elif lang == "hi":
            resp_text = f"🎉 बहुत बढ़िया! ₹{int(approved)} में डील तय हुई! आइए आपका ऑर्डर पूरा करने के लिए आगे बढ़ते हैं।"
        else:
            resp_text = f"🎉 Wonderful! Let's continue with your order at the agreed price of ₹{int(approved)}."

        session["messages"].append({"sender": "user", "text": payload.message, "timestamp": datetime.utcnow().isoformat()})
        session["messages"].append({"sender": "assistant", "text": resp_text, "action": "accept", "timestamp": datetime.utcnow().isoformat()})

        return {
            "session_id": payload.session_id,
            "action": "accept",
            "message": resp_text,
            "approved_price": approved,
            "counter_price": approved,
            "rounds_used": session["rounds_used"],
            "rounds_remaining": max(0, 3 - session["rounds_used"]),
            "is_final": True
        }

    # If no price could be determined from the user input
    if customer_offer is None:
        lang = session["language"]
        if lang == "ta":
            clarify = "தயவுசெய்து நீங்கள் வாங்க விரும்பும் குறிப்பிட்ட விலையை (எ.கா: ₹1,500) குறிப்பிட முடியுமா?"
        elif lang == "hi":
            clarify = "कृपया वह निश्चित कीमत बताएं जिस पर आप खरीदना चाहते हैं (जैसे: ₹1,500)?"
        else:
            clarify = "Could you please specify the price you'd like to offer (e.g. ₹1,500)?"

        session["messages"].append({"sender": "user", "text": payload.message, "timestamp": datetime.utcnow().isoformat()})
        session["messages"].append({"sender": "assistant", "text": clarify, "action": "clarify", "timestamp": datetime.utcnow().isoformat()})

        return {
            "session_id": payload.session_id,
            "action": "clarify",
            "message": clarify,
            "approved_price": session["current_approved_price"],
            "counter_price": session["current_approved_price"],
            "rounds_used": session["rounds_used"],
            "rounds_remaining": max(0, 3 - session["rounds_used"]),
            "is_final": False
        }

    # Secure Evaluation on Backend (Seller confidential rules checked safely)
    eval_result = await pricing_service.evaluate_offer(
        product_id=session["product_id"],
        listed_price=session["listed_price"],
        customer_offer=customer_offer,
        session_id=payload.session_id,
        current_round=session["rounds_used"]
    )

    action = eval_result["action"]
    approved_price = eval_result["approved_price"]
    session["rounds_used"] += 1
    rounds_left = max(0, 3 - session["rounds_used"])

    lang = session["language"]

    if action == "accept":
        session["status"] = "accepted"
        session["current_approved_price"] = approved_price
        if lang == "ta":
            msg_text = f"🎉 அருமை! உங்கள் சலுகை ₹{int(approved_price)} ஏற்றுக்கொள்ளப்பட்டது. இப்போதே வாங்கத் தொடருங்கள்!"
        elif lang == "hi":
            msg_text = f"🎉 बहुत बढ़िया! आपका ₹{int(approved_price)} का ऑफर स्वीकार कर लिया गया है। आइए ऑर्डर पूरा करें!"
        else:
            msg_text = f"🎉 Wonderful! It's a deal! I'm happy to accept ₹{int(approved_price)}. Let's proceed with your checkout!"
        is_final = True

    elif action == "counter":
        session["current_approved_price"] = approved_price
        if rounds_left == 0:
            is_final = True
            if lang == "ta":
                msg_text = f"உங்கள் சலுகையை புரிந்துகொண்டேன். நான் வழங்கக்கூடிய இறுதி சிறந்த விலை ₹{int(approved_price)}. இந்த விலையில் தொடர விரும்புகிறீர்களா?"
            elif lang == "hi":
                msg_text = f"मैं आपका प्रस्ताव समझता हूँ। मैं जो अंतिम और सर्वश्रेष्ठ कीमत दे सकता हूँ वह ₹{int(approved_price)} है। क्या आप आगे बढ़ना चाहेंगे?"
            else:
                msg_text = f"I understand your offer. Let me check the best available price for you. I can offer this product for ₹{int(approved_price)}. Would you like to proceed?"
        else:
            is_final = False
            if lang == "ta":
                msg_text = f"நான் உங்கள் சலுகையை மதிக்கிறேன். ஆனால் அந்த விலையில் தர இயலாது, ₹{int(approved_price)} விலையில் வழங்க முடியும். தொடரலாமா?"
            elif lang == "hi":
                msg_text = f"मैं आपका प्रस्ताव समझता हूँ। हालांकि उस कीमत पर नहीं, लेकिन मैं इसे ₹{int(approved_price)} में दे सकता हूँ। क्या आप सहमत हैं?"
            else:
                msg_text = f"I understand your offer. Let me check the best available price for you. I can offer this product for ₹{int(approved_price)}. Would you like to proceed?"

    else:  # max_rounds or reject
        session["status"] = "rejected"
        is_final = True
        best_price = session["current_approved_price"] or session["listed_price"]
        if lang == "ta":
            msg_text = f"மன்னிக்கவும், அந்த விலையில் எங்களால் இந்த தயாரிப்பை வழங்க முடியவில்லை. எங்கள் சிறந்த சலுகை அல்லது இதே போன்ற பிற தயாரிப்புகளை பரிந்துரைக்கட்டுமா?"
        elif lang == "hi":
            msg_text = f"माफ़ कीजिए, हम इस कीमत पर यह उत्पाद देने में असमर्थ हैं। हालाँकि, क्या मैं आपको कोई अन्य आकर्षक ऑफ़र या समान उत्पाद सुझा सकता हूँ?"
        else:
            msg_text = f"Sorry, we are unable to offer this product at that price. However, I can suggest another attractive offer or a similar product."

    session["messages"].append({"sender": "user", "text": payload.message, "timestamp": datetime.utcnow().isoformat()})
    session["messages"].append({"sender": "assistant", "text": msg_text, "action": action, "timestamp": datetime.utcnow().isoformat()})

    return {
        "session_id": payload.session_id,
        "action": action,
        "message": msg_text,
        "approved_price": approved_price if action in ("accept", "counter") else None,
        "counter_price": approved_price if action in ("accept", "counter") else None,
        "rounds_used": session["rounds_used"],
        "rounds_remaining": rounds_left,
        "is_final": is_final
    }


@router.post("/accept", response_model=BargainingMessageResponse)
async def accept_current_offer(session_id: str = Query(...)):
    """Explicitly accept the current counteroffer and lock in price."""
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    approved = session.get("current_approved_price") or session.get("listed_price")
    session["status"] = "accepted"
    lang = session["language"]

    if lang == "ta":
        text = f"அருமை! ₹{int(approved)} விலையில் உறுதி செய்யப்பட்டது. செக்அவுட் தொடரலாம்!"
    elif lang == "hi":
        text = f"शानदार! ₹{int(approved)} की विशेष कीमत सुरक्षित कर ली गई है। चेकआउट पर आगे बढ़ते हैं!"
    else:
        text = f"Wonderful! Price locked at ₹{int(approved)}. Proceeding to delivery & checkout!"

    return {
        "session_id": session_id,
        "action": "accept",
        "message": text,
        "approved_price": approved,
        "counter_price": approved,
        "rounds_used": session["rounds_used"],
        "rounds_remaining": max(0, 3 - session["rounds_used"]),
        "is_final": True
    }


@router.post("/reject", response_model=BargainingMessageResponse)
async def reject_offer(session_id: str = Query(...)):
    """Customer declines counteroffer; returns polite alternative recommendation."""
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["status"] = "rejected"
    lang = session["language"]

    if lang == "ta":
        text = "எங்கள் தயாரிப்பை பார்த்ததற்கு நன்றி! உங்கள் பட்ஜெட்டுக்கு ஏற்ற பிற தயாரிப்புகளை நீங்கள் உலாவலாம்."
    elif lang == "hi":
        text = "कोई बात नहीं! आप अपने बजट के अनुकूल अन्य बेहतरीन उत्पाद देख सकते हैं।"
    else:
        text = "No problem at all! Feel free to browse our similar recommendations or explore today's top deals."

    return {
        "session_id": session_id,
        "action": "reject",
        "message": text,
        "approved_price": None,
        "counter_price": None,
        "rounds_used": session["rounds_used"],
        "rounds_remaining": 0,
        "is_final": True
    }


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve bargaining session details."""
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
