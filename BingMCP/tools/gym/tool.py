from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached


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
            "hours": str,
        }
    """
    # TODO (Ross): replace with actual API/scrape call
    return {
        "capacity_percent": 0,
        "is_open": False,
        "hours": "",
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
                "is_open": bool,
                "hours": str
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
