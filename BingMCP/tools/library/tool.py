import html
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import httpx
from mcp.server.fastmcp import FastMCP

from cache import get_cached, set_cached

_LIBCAL_PAGE_URL = "https://libcal.binghamton.edu/spaces"
_LIBCAL_GRID_URL = "https://libcal.binghamton.edu/spaces/availability/grid"
_HTTP_TIMEOUT = 20.0
_ET = ZoneInfo("America/New_York")

_REQUEST_HEADERS = {
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (compatible; BingMCP/1.0)",
}

_GRID_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
}

_ROOM_NAME_PATTERN = re.compile(r'resourceNameIdMap\["eid_(\d+)"\]\s*=\s*"([^"]*)";')

LIBRARY_CONFIG = {
    "bartle": {
        "lid": 4610,
        "categories": {
            "group_study": 7823,
            "third_floor_projects": 46677,
            "media_viewing": 30039,
            "fine_arts_study": 49381,
            "bloomberg": 7830,
        },
    },
    "science": {
        "lid": 4608,
        "categories": {
            "group_study": 7832,
            "collaboration_space": 26438,
        },
    },
    "udc": {
        "lid": 4611,
        "categories": {
            "group_study": 7835,
        },
    },
}


def _normalize_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower().strip()).strip("_")


def _decode_js_string(value: str) -> str:
    try:
        return html.unescape(bytes(value, "utf-8").decode("unicode_escape"))
    except UnicodeDecodeError:
        return html.unescape(value)


def _extract_room_names(page_html: str) -> dict[str, str]:
    room_name_by_item_id: dict[str, str] = {}
    for item_id, raw_name in _ROOM_NAME_PATTERN.findall(page_html):
        room_name_by_item_id[item_id] = _decode_js_string(raw_name).strip()
    return room_name_by_item_id


def _parse_slot_datetime(value: str) -> datetime | None:
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        parsed = None

    if parsed is not None:
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=_ET)
        return parsed.astimezone(_ET)

    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=_ET)
    except ValueError:
        return None


async def _fetch_library_rooms(library: str, category: str) -> dict:
    lib_key = _normalize_token(library)
    cat_key = _normalize_token(category)

    lib_conf = LIBRARY_CONFIG.get(lib_key)
    if lib_conf is None:
        raise ValueError(f"Unknown library '{library}'. Use: {sorted(LIBRARY_CONFIG)}")

    category_map = lib_conf["categories"]
    gid = category_map.get(cat_key)
    if gid is None:
        raise ValueError(
            f"Unknown category '{category}' for {library}. Use: {sorted(category_map)}"
        )

    lid = lib_conf["lid"]
    now = datetime.now(_ET)
    start_date = now.date().isoformat()
    end_date = (now.date() + timedelta(days=1)).isoformat()

    page_url = f"{_LIBCAL_PAGE_URL}?lid={lid}&gid={gid}"
    post_data = {
        "lid": str(lid),
        "gid": str(gid),
        "eid": "-1",
        "seat": "0",
        "seatId": "0",
        "zone": "0",
        "start": start_date,
        "end": end_date,
        "pageIndex": "0",
        "pageSize": "200",
    }

    async with httpx.AsyncClient(
        timeout=_HTTP_TIMEOUT, follow_redirects=True
    ) as client:
        page_response = await client.get(page_url, headers=_REQUEST_HEADERS)
        if page_response.status_code != 200:
            raise RuntimeError(
                f"LibCal page request failed with {page_response.status_code}"
            )
        room_name_by_item_id = _extract_room_names(page_response.text)

        headers = dict(_REQUEST_HEADERS)
        headers.update(_GRID_HEADERS)
        headers["Referer"] = page_url
        headers["Origin"] = "https://libcal.binghamton.edu"

        response = await client.post(_LIBCAL_GRID_URL, headers=headers, data=post_data)

    if response.status_code != 200:
        snippet = response.text.replace("\n", " ").strip()[:160]
        raise RuntimeError(f"LibCal API error {response.status_code}: {snippet}")

    try:
        payload = response.json()
    except ValueError as exc:
        raise RuntimeError("LibCal API returned non-JSON data.") from exc

    if isinstance(payload, dict):
        slots = payload.get("slots", [])
    elif isinstance(payload, list):
        slots = payload
    else:
        raise RuntimeError("LibCal API returned an unexpected payload.")

    available_rooms = set()

    for slot in slots:
        if not isinstance(slot, dict):
            continue

        class_name = slot.get("className")
        if class_name not in (None, ""):
            continue

        start_dt = _parse_slot_datetime(str(slot.get("start", "")))
        end_dt = _parse_slot_datetime(str(slot.get("end", "")))
        if start_dt is None or end_dt is None:
            continue
        if not (start_dt <= now < end_dt):
            continue

        item_id = slot.get("itemId")
        room_name = (
            slot.get("title")
            or slot.get("name")
            or room_name_by_item_id.get(str(item_id), "")
        )
        room_name = str(room_name).strip()
        if room_name:
            available_rooms.add(room_name)

    return {
        "library": library,
        "category": category,
        "available_rooms": sorted(available_rooms),
    }


def register(mcp: FastMCP):

    @mcp.tool()
    async def get_available_library_rooms(
        library: str = "bartle",
        category: str = "group_study",
    ) -> dict:
        """
        Returns library study rooms currently available to book at Binghamton University.

        Args:
            library: Library building: "bartle", "science", or "udc".
            category: Room category for that library.

        Returns on success:
            {
                "library": str,
                "category": str,
                "available_rooms": list[str]
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str
            }
        """
        cache_key = f"{_normalize_token(library)}:{_normalize_token(category)}"
        cached = get_cached("library", cache_key)
        if cached is not None:
            return cached

        try:
            result = await _fetch_library_rooms(library, category)
        except Exception as exc:
            return {"status": "unavailable", "reason": str(exc)}

        set_cached("library", cache_key, result)
        return result
