from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached


# ── ROSS: only edit the return statement inside _fetch_dining() ──────────────
# Do NOT change the function signature, the cache logic, or error handling.
async def _fetch_dining(hall: str) -> dict:
    """
    Internal data-fetch stub. Ross replaces the return statement with real
    API/scraping logic (e.g. BU Dining Services site or Transact feed).

    Must return:
        {
            "hall": str,
            "is_open": bool,
            "hours": str,
            "capacity_percent": int,
        }
    """
    # TODO (Ross): replace with actual API/scrape call
    return {
        "hall": hall,
        "is_open": False,
        "hours": "",
        "capacity_percent": 0,
    }
# ─────────────────────────────────────────────────────────────────────────────


def register(mcp: FastMCP):

    @mcp.tool()
    async def get_dining_status(hall: str) -> dict:
        """
        Returns open/closed status, current hours, and estimated capacity
        for a Binghamton University dining hall.

        Supported halls:
          - C4 (Chenango Champlain Collegiate Center)
          - ACC (Appalachian Collegiate Center)
          - Hinman Dining

        Args:
            hall: Name or abbreviation of the dining hall (case-insensitive),
                  e.g. "C4", "ACC", "Hinman".

        Returns on success:
            {
                "hall": str,
                "is_open": bool,
                "hours": str,
                "capacity_percent": int
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str,
                "hall": str
            }
        """
        cache_key = hall.lower().strip()
        cached = get_cached("dining", cache_key)
        if cached is not None:
            return cached

        try:
            result = await _fetch_dining(hall)
        except Exception as exc:
            return {
                "status": "unavailable",
                "reason": str(exc),
                "hall": hall,
            }

        set_cached("dining", cache_key, result)
        return result
