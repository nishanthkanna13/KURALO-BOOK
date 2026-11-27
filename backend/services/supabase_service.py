"""
Supabase client initialization and helper functions.
Falls back to demo mode if SUPABASE_URL is not configured.
"""
import os
import logging
from typing import Optional, Any, Dict

logger = logging.getLogger(__name__)

# Lazy-init client
_supabase_client = None
_is_demo_mode: Optional[bool] = None


def is_demo_mode() -> bool:
    global _is_demo_mode
    if _is_demo_mode is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")
        _is_demo_mode = not (url and key and url.startswith("https://"))
        if _is_demo_mode:
            logger.warning("SUPABASE not configured — running in DEMO mode")
    return _is_demo_mode


def get_supabase():
    """Return the Supabase client, or None in demo mode."""
    global _supabase_client
    if is_demo_mode():
        return None
    if _supabase_client is None:
        try:
            from supabase import create_client, Client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
            _supabase_client = create_client(url, key)
            logger.info("Supabase client initialised")
        except Exception as e:
            logger.error(f"Failed to init Supabase: {e}")
            _supabase_client = None
    return _supabase_client


# ───────────────────────── Helpers ─────────────────────────────

async def db_select(table: str, filters: Optional[Dict] = None, columns: str = "*", limit: int = 100, offset: int = 0):
    """Generic select helper. Returns list of dicts."""
    sb = get_supabase()
    if sb is None:
        return []
    try:
        q = sb.table(table).select(columns)
        if filters:
            for k, v in filters.items():
                q = q.eq(k, v)
        result = q.limit(limit).offset(offset).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"db_select({table}): {e}")
        return []


async def db_insert(table: str, data: Dict) -> Optional[Dict]:
    """Insert a row and return it."""
    sb = get_supabase()
    if sb is None:
        return None
    try:
        result = sb.table(table).insert(data).execute()
        return (result.data or [None])[0]
    except Exception as e:
        logger.error(f"db_insert({table}): {e}")
        return None


async def db_update(table: str, row_id: str, data: Dict, id_col: str = "id") -> Optional[Dict]:
    """Update a row by id and return it."""
    sb = get_supabase()
    if sb is None:
        return None
    try:
        result = sb.table(table).update(data).eq(id_col, row_id).execute()
        return (result.data or [None])[0]
    except Exception as e:
        logger.error(f"db_update({table}): {e}")
        return None


async def db_delete(table: str, row_id: str, id_col: str = "id") -> bool:
    """Delete a row by id."""
    sb = get_supabase()
    if sb is None:
        return False
    try:
        sb.table(table).delete().eq(id_col, row_id).execute()
        return True
    except Exception as e:
        logger.error(f"db_delete({table}): {e}")
        return False


async def db_count(table: str, filters: Optional[Dict] = None) -> int:
    """Count rows in a table."""
    sb = get_supabase()
    if sb is None:
        return 0
    try:
        q = sb.table(table).select("id", count="exact")
        if filters:
            for k, v in filters.items():
                q = q.eq(k, v)
        result = q.execute()
        return result.count or 0
    except Exception as e:
        logger.error(f"db_count({table}): {e}")
        return 0
