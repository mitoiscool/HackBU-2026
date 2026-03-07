from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached


# ── ROSS: only edit the return statement inside _fetch_bus() ─────────────────
# Do NOT change the function signature, the cache logic, or error handling.
async def _fetch_bus() -> dict:
    """
    Internal data-fetch stub. Ross replaces the return statement with real
    API/scraping logic (e.g. BU TransLoc or Passio GO feed).

    Must return:
        {
            "routes": [
                {
                    "name": str,
                    "next_arrival_minutes": int,
                    "current_stop": str,
                },
                ...
            ]
        }
    """
    # TODO (Ross): replace with actual API/scrape call
    return {
        "routes": [],
    }
# ─────────────────────────────────────────────────────────────────────────────


def register(mcp: FastMCP):

    @mcp.tool()
    async def get_bus_locations() -> dict:
        """
        Returns current locations and next arrival estimates for Binghamton
        University campus bus routes.

        Routes covered include: Inner Loop, Outer Loop, Night Owl, Express.

        Returns on success:
            {
                "routes": [
                    {
                        "name": str,
                        "next_arrival_minutes": int,
                        "current_stop": str
                    },
                    ...
                ]
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str
            }
        """
        cached = get_cached("bus", "all")
        if cached is not None:
            return cached

        try:
            result = await _fetch_bus()
        except Exception as exc:
            return {
                "status": "unavailable",
                "reason": str(exc),
            }

        set_cached("bus", "all", result)
        return result
