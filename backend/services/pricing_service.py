"""
Pricing Service — server-side only.
NEVER expose seller minimum_price or profit_floor to the client.
All pricing decisions happen exclusively here.
"""
import os
import logging
from typing import Optional, Dict
from services.supabase_service import get_supabase, is_demo_mode
from services.demo_data import SELLER_PRICING_RULES, DEMO_PRODUCTS

logger = logging.getLogger(__name__)

MAX_ROUNDS = 3


def _find_demo_product(product_id: str) -> Optional[Dict]:
    for p in DEMO_PRODUCTS:
        if p["id"] == product_id:
            return p
    return None


class PricingService:
    """
    Encapsulates all seller pricing logic.
    The client NEVER receives min_price or seller margins.
    """

    async def get_seller_rules(self, product_id: str) -> Optional[Dict]:
        """
        Fetch seller pricing rules.
        Returns dict with keys: min_price, seller_id
        Returns None if product not found.
        """
        if is_demo_mode():
            return SELLER_PRICING_RULES.get(product_id)

        sb = get_supabase()
        if sb is None:
            return SELLER_PRICING_RULES.get(product_id)

        try:
            result = (
                sb.table("seller_pricing_rules")
                .select("min_price, seller_id, product_id")
                .eq("product_id", product_id)
                .single()
                .execute()
            )
            if result.data:
                return result.data
        except Exception as e:
            logger.warning(f"seller_rules DB miss for {product_id}: {e}")

        # Fallback to demo rules if product isn't in DB
        return SELLER_PRICING_RULES.get(product_id)

    async def get_session_round(self, session_id: str) -> int:
        """Return how many counter-rounds have been used so far."""
        if is_demo_mode() or not session_id:
            return 0
        sb = get_supabase()
        if sb is None:
            return 0
        try:
            result = (
                sb.table("bargaining_sessions")
                .select("rounds_used")
                .eq("id", session_id)
                .single()
                .execute()
            )
            return int((result.data or {}).get("rounds_used", 0))
        except Exception:
            return 0

    def calculate_counteroffer(
        self,
        listed_price: float,
        customer_offer: float,
        min_price: float,
        negotiation_round: int,
    ) -> Optional[float]:
        """
        Core pricing algorithm — server-side only.
        Returns approved/counter price, or None when max rounds exceeded.
        """
        if customer_offer >= min_price:
            # Accept — customer's offer covers the floor
            return customer_offer

        # Can't accept — build a counter
        margin = listed_price - min_price
        if margin <= 0:
            return None  # no room to negotiate

        if negotiation_round == 0:
            counteroffer = listed_price - (margin * 0.6)
        elif negotiation_round == 1:
            counteroffer = listed_price - (margin * 0.75)
        else:
            # Max rounds exceeded
            return None

        return round(counteroffer / 10) * 10  # round to nearest 10

    async def evaluate_offer(
        self,
        product_id: str,
        listed_price: float,
        customer_offer: float,
        session_id: str,
        current_round: int,
    ) -> Dict:
        """
        Main evaluation entry point.
        Returns dict:
          action: 'accept' | 'counter' | 'reject' | 'max_rounds'
          approved_price: float (safe to send to client)
          round_number: int
        """
        rules = await self.get_seller_rules(product_id)
        if rules is None:
            # Product has no seller rules — accept any offer above 70% of listed
            min_price = listed_price * 0.70
        else:
            min_price = float(rules["min_price"])

        if current_round >= MAX_ROUNDS:
            return {
                "action": "max_rounds",
                "approved_price": None,
                "round_number": current_round,
            }

        result_price = self.calculate_counteroffer(
            listed_price=listed_price,
            customer_offer=customer_offer,
            min_price=min_price,
            negotiation_round=current_round,
        )

        if result_price is None:
            return {
                "action": "max_rounds",
                "approved_price": None,
                "round_number": current_round,
            }

        if customer_offer >= min_price:
            return {
                "action": "accept",
                "approved_price": customer_offer,
                "round_number": current_round,
            }

        return {
            "action": "counter",
            "approved_price": result_price,
            "round_number": current_round + 1,
        }


pricing_service = PricingService()
