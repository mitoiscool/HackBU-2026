from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached


# ── ROSS: only edit the return statement inside _fetch_laundry() ─────────────
# Do NOT change the function signature, the cache logic, or error handling.
async def _fetch_laundry(building: str) -> dict:
    """
    Internal data-fetch stub. Ross replaces the return statement with real
    API/scraping logic (e.g. LaundryView API).

    Must return:
        {
            "building": str,
            "washers": {"available": int, "total": int},
            "dryers":  {"available": int, "total": int},
        }
    """
    # TODO (Ross): replace with actual API/scrape call
    return {
        "building": building,
        "washers": {"available": 0, "total": 0},
        "dryers":  {"available": 0, "total": 0},
    }
# ─────────────────────────────────────────────────────────────────────────────


def register(mcp: FastMCP):

    @mcp.tool()
    async def get_laundry_availability(building: str) -> dict:
        """
        Returns real-time washer and dryer availability for a Binghamton
        University residential laundry room.

        Supported buildings include: Hinman, Newing, Dickinson, Mountainview,
        Hillside, CIW (College-in-the-Woods), and other BU residential areas.

        Args:
            building: Name of the BU residential building (case-insensitive),
                      e.g. "Hinman", "Newing", "CIW".

        Returns on success:
            {
                "building": str,
                "washers": {"available": int, "total": int},
                "dryers":  {"available": int, "total": int}
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str,
                "building": str
            }
        """
        cache_key = building.lower().strip()
        cached = get_cached("laundry", cache_key)
        if cached is not None:
            return cached

        try:
            result = await _fetch_laundry(building)
        except Exception as exc:
            return {
                "status": "unavailable",
                "reason": str(exc),
                "building": building,
            }

        set_cached("laundry", cache_key, result)
        return result
