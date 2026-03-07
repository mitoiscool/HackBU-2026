import httpx
from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached

_GYM_URL = "https://binggym.com/api/gym"
_HTTP_TIMEOUT = 15.0

_REQUEST_HEADERS = {
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (compatible; BingMCP/1.0)",
}


def _coerce_int(value, fallback: int = 0) -> int:
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return fallback


# ── ROSS: only edit the return statement inside _fetch_gym() ─────────────────
# Do NOT change the function signature, the cache logic, or error handling.
async def _fetch_gym() -> dict:
    """
    Internal data-fetch stub. Ross replaces the return statement with real
    API/scraping logic (e.g. BU Recreation headcount API or web scrape).

    Must return:
        {
            "capacity_percent": int,
            "is_open": bool,
        }
    """
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(_GYM_URL, headers=_REQUEST_HEADERS)

    if response.status_code != 200:
        raise RuntimeError(f"BingGym API error {response.status_code}")

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("BingGym API returned non-JSON data.") from exc

    if not isinstance(data, dict):
        raise RuntimeError("BingGym API returned an unexpected payload.")

    raw_percent = data.get("percentage", data.get("current_occupancy", 0))
    capacity_percent = _coerce_int(raw_percent, fallback=0)
    if capacity_percent < 0:
        capacity_percent = 0
    if capacity_percent > 100:
        capacity_percent = 100

    raw_count = data.get("count", data.get("current_occupancy_absolute"))
    count = _coerce_int(raw_count, fallback=0)
    if count < 0:
        count = 0

    is_open_raw = data.get("is_open")
    if isinstance(is_open_raw, bool):
        is_open = is_open_raw
    else:
        status = str(data.get("current_status", "")).strip().lower()
        is_open = status not in {"", "closed", "closing"}

    return {
        "capacity_percent": capacity_percent,
        "is_open": is_open,
        "count": count,
    }
# ─────────────────────────────────────────────────────────────────────────────


def register(mcp: FastMCP):

    @mcp.tool()
    async def get_gym_capacity() -> dict:
        """
        Returns current occupancy and operating hours for the Binghamton
        University East Gym (Events Center).

        Returns on success:
            {
                "capacity_percent": int,
                "is_open": bool
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str
            }
        """
        cached = get_cached("gym", "main")
        if cached is not None:
            return cached

        try:
            result = await _fetch_gym()
        except Exception as exc:
            return {
                "status": "unavailable",
                "reason": str(exc),
            }

        set_cached("gym", "main", result)
        return result
