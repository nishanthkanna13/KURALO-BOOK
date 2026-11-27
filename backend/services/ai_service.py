"""
AI Service — generates natural language for bargaining responses.
Uses OpenAI gpt-4o-mini if OPENAI_API_KEY is set, else falls back to multilingual canned responses.
The LLM NEVER independently decides price. It only formats the message supplied by the backend.
"""
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# ─────────────────────── Canned responses ───────────────────────

CANNED: Dict[str, Dict[str, str]] = {
    "greeting": {
        "en": (
            "Hello! Welcome to Kuralo Book 🛍️\n"
            "I see you're interested in this product. I'd be happy to discuss pricing with you! "
            "What price did you have in mind?"
        ),
        "ta": (
            "வணக்கம்! Kuralo Book-க்கு வரவேற்கிறோம் 🛍️\n"
            "நீங்கள் இந்த தயாரிப்பில் ஆர்வம் காட்டுவதை பார்க்கிறேன். விலை பற்றி பேசலாம்! "
            "நீங்கள் எந்த விலையை எதிர்பார்க்கிறீர்கள்?"
        ),
        "hi": (
            "नमस्ते! Kuralo Book में आपका स्वागत है 🛍️\n"
            "मुझे देख रहा है आप इस प्रोडक्ट में रुचि रखते हैं। कीमत के बारे में बात करते हैं! "
            "आप कितनी कीमत सोच रहे हैं?"
        ),
    },
    "counter": {
        "en": (
            "Thank you for your offer! I appreciate your interest. "
            "While I can't accept that price, I can offer you ₹{approved_price} — that's already a great deal! "
            "What do you think?"
        ),
        "ta": (
            "உங்கள் சலுகைக்கு நன்றி! உங்கள் ஆர்வத்தை நான் மதிக்கிறேன். "
            "அந்த விலையில் நான் ஒப்புக்கொள்ள முடியாது, ஆனால் ₹{approved_price} விலையில் தர முடியும் — இது ஒரு சிறந்த சலுகை! "
            "என்ன நினைக்கிறீர்கள்?"
        ),
        "hi": (
            "आपके ऑफर के लिए धन्यवाद! मैं आपकी रुचि की सराहना करता हूं। "
            "उस कीमत पर मैं सहमत नहीं हो सकता, लेकिन ₹{approved_price} में दे सकता हूं — यह वाकई एक बेहतरीन डील है! "
            "आप क्या सोचते हैं?"
        ),
    },
    "accept": {
        "en": (
            "🎉 Excellent! It's a deal! I'm happy to accept ₹{approved_price}. "
            "Add to cart and use this price at checkout. Enjoy your purchase!"
        ),
        "ta": (
            "🎉 அருமை! ஒப்பந்தம்! ₹{approved_price} விலையை ஏற்றுக்கொள்கிறேன். "
            "கார்ட்டில் சேர்த்து, செலுத்தும்போது இந்த விலையைப் பயன்படுத்துங்கள். வாங்குவதை ரசியுங்கள்!"
        ),
        "hi": (
            "🎉 बहुत बढ़िया! डील हो गई! मैं ₹{approved_price} स्वीकार करने में खुश हूं। "
            "कार्ट में जोड़ें और चेकआउट पर यही कीमत इस्तेमाल करें। खरीदारी का आनंद लें!"
        ),
    },
    "max_rounds": {
        "en": (
            "Thank you for your patience, but I'm afraid we've reached the limit of our negotiation. "
            "The best price I can offer is ₹{listed_price}. "
            "May I suggest checking our other great deals or similar products? 🙏"
        ),
        "ta": (
            "உங்கள் பொறுமைக்கு நன்றி, ஆனால் நம் பேரம் பேசுவதில் வரம்பை எட்டிவிட்டோம். "
            "நான் வழங்கக்கூடிய சிறந்த விலை ₹{listed_price} தான். "
            "மற்ற சிறந்த சலுகைகள் அல்லது இதே மாதிரியான பொருட்களை பார்க்கலாமா? 🙏"
        ),
        "hi": (
            "आपके धैर्य के लिए धन्यवाद, लेकिन हमारी बातचीत की सीमा आ गई है। "
            "मैं जो सबसे अच्छी कीमत दे सकता हूं वह ₹{listed_price} है। "
            "क्या मैं हमारे अन्य बेहतरीन डील या इसी तरह के उत्पाद सुझा सकता हूं? 🙏"
        ),
    },
}


class AIService:
    """
    Generates natural language for bargaining actions.
    Backend provides the action and prices; AI only formats the message.
    """

    def _get_canned(
        self,
        action: str,
        language: str,
        prices: Dict,
    ) -> str:
        lang = language if language in ("en", "ta", "hi") else "en"
        template = CANNED.get(action, CANNED["counter"]).get(lang, CANNED[action]["en"])
        return template.format(
            approved_price=int(prices.get("approved", 0)),
            listed_price=int(prices.get("listed", 0)),
            customer_offer=int(prices.get("customer_offer", 0)),
        )

    async def generate_bargaining_response(
        self,
        action: str,
        prices: Dict,
        language: str = "en",
        context: Optional[Dict] = None,
    ) -> str:
        """
        Generate a natural-language message for a bargaining action.

        Parameters
        ----------
        action   : 'greeting' | 'counter' | 'accept' | 'reject' | 'max_rounds'
        prices   : {'listed': X, 'approved': Y, 'customer_offer': Z}
        language : 'en' | 'ta' | 'hi'
        context  : optional extra dict (product_name, etc.)
        """
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            return self._get_canned(action, language, prices)

        try:
            import openai  # type: ignore

            openai.api_key = api_key
            lang_name = {"en": "English", "ta": "Tamil", "hi": "Hindi"}.get(language, "English")
            product_name = (context or {}).get("product_name", "this product")

            system_prompt = (
                "You are a friendly, professional sales assistant for Kuralo Book, "
                "a premium Indian e-commerce marketplace. "
                "Your role is ONLY to format a price negotiation message naturally. "
                "You NEVER decide the price yourself — the backend provides it. "
                f"Always reply in {lang_name}. Keep the tone warm and professional."
            )

            user_prompt = self._build_user_prompt(action, prices, product_name, lang_name)

            response = await openai.ChatCompletion.acreate(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=200,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.warning(f"OpenAI call failed, falling back to canned response: {e}")
            return self._get_canned(action, language, prices)

    def _build_user_prompt(self, action: str, prices: Dict, product_name: str, lang_name: str) -> str:
        listed = prices.get("listed", 0)
        approved = prices.get("approved", 0)
        customer_offer = prices.get("customer_offer", 0)

        if action == "greeting":
            return (
                f"The customer is looking at '{product_name}' listed at ₹{listed}. "
                f"Write a warm greeting inviting them to make an offer. Reply in {lang_name}."
            )
        elif action == "counter":
            return (
                f"The customer offered ₹{customer_offer} for '{product_name}' (listed ₹{listed}). "
                f"The store is countering with ₹{approved}. "
                f"Write a polite counter-offer message mentioning the counter price of ₹{approved}. Reply in {lang_name}."
            )
        elif action == "accept":
            return (
                f"The customer offered ₹{customer_offer} for '{product_name}'. "
                f"The store accepts at ₹{approved}. "
                f"Write an enthusiastic acceptance message mentioning ₹{approved}. Reply in {lang_name}."
            )
        elif action == "max_rounds":
            return (
                f"Negotiations for '{product_name}' have reached the maximum rounds. "
                f"The store cannot go below ₹{listed}. "
                f"Politely close the negotiation and suggest exploring other deals. Reply in {lang_name}."
            )
        else:
            return (
                f"Write a polite message for action '{action}' regarding '{product_name}' "
                f"at price ₹{approved}. Reply in {lang_name}."
            )


ai_service = AIService()
