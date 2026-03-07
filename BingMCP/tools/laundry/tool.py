import re

import httpx
from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached

_LAUNDRY_BASE_URL = "https://www.laundryview.com/api/currentRoomData"
_SCHOOL_KEY = "8861"
_HTTP_TIMEOUT = 15.0

LAUNDRY_CONFIG = {
    "windham_g14": 415890008,
    "bingham_122": 415890060,
    "bingham_hall_122": 415890060,
    "brandywine_116a": 415890026,
    "broome_g18": 415890061,
    "cascade_g14": 415890006,
    "cayuga_209": 415890042,
    "choconut_116a": 415890029,
    "chocont_116a": 415890029,
    "cleveland_lr": 415890055,
    "delaware_117": 415890062,
    "digman_g11": 415890032,
    "digman_g_11": 415890032,
    "endicott_g26": 415890063,
    "glenwood_116a": 415890027,
    "hughes_a_b1": 415890005,
    "hughes_b_b7": 415890059,
    "hunter_g14": 415890007,
    "johnson_g25a": 415890049,
    "johnson_g_25a": 415890049,
    "lehman_a_b1": 415890004,
    "lehman_b_b7": 415890058,
    "marcy_g14": 415890009,
    "mohawk_g05": 415890041,
    "nanticoke_116a": 415890028,
    "oconnor_g06": 415890065,
    "oconnor_g_06": 415890065,
    "old_digman": 415890066,
    "oneida_111": 415890043,
    "onondaga": 415890044,
    "rafuse_124": 415890064,
    "roosevelt_a_b1": 415890002,
    "roosevelt_b_b7": 415890056,
    "seneca_107": 415890045,
    "smith_b_b7": 415890057,
    "smith_dorm_a_b1": 415890003,
}

_REQUEST_HEADERS = {
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (compatible; BingMCP/1.0)",
}


def _normalize_building_token(building: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", building.lower().strip()).strip("_")


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
    token = _normalize_building_token(building)
    location_id = LAUNDRY_CONFIG.get(token)
    if location_id is None:
        raise ValueError(
            f"Unknown building '{building}'. Valid keys: {sorted(LAUNDRY_CONFIG)}"
        )

    params = {
        "school_desc_key": _SCHOOL_KEY,
        "location": str(location_id),
    }

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            _LAUNDRY_BASE_URL,
            params=params,
            headers=_REQUEST_HEADERS,
        )

    if response.status_code != 200:
        raise RuntimeError(f"LaundryView API error {response.status_code}")

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("LaundryView API returned non-JSON data.") from exc

    washers_avail = washers_total = 0
    dryers_avail = dryers_total = 0

    for machine in data.get("objects", []):
        machine_type = machine.get("appliance_type")
        if machine_type not in {"W", "D"}:
            continue

        time_left_lite = str(machine.get("time_left_lite", "")).strip().lower()
        is_available = time_left_lite == "available"

        if machine_type == "W":
            washers_total += 1
            if is_available:
                washers_avail += 1
        elif machine_type == "D":
            dryers_total += 1
            if is_available:
                dryers_avail += 1

    return {
        "building": building,
        "washers": {"available": washers_avail, "total": washers_total},
        "dryers": {"available": dryers_avail, "total": dryers_total},
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
