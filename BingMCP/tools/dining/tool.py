from datetime import date as date_cls
from datetime import datetime, timezone
from typing import Any, Iterable, Optional
from zoneinfo import ZoneInfo

import httpx
from mcp.server.fastmcp import FastMCP

from cache import get_cached, set_cached

_SODEXO_BASE_URL = "https://api-prd.sodexomyway.net/v0.2"
_SODEXO_API_KEY = "<LOOK_ON_THE_MENU_WEBSITE>"
_BINGHAMTON_TIMEZONE = ZoneInfo("America/New_York")
_HTTP_TIMEOUT_SECONDS = 20.0

_REQUEST_HEADERS = {
    "API-Key": _SODEXO_API_KEY,
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (compatible; BingMCP/1.0)",
    "Referer": "https://binghamton.sodexomyway.com/",
}

_HALLS = {
    "hinman": {
        "key": "hinman",
        "display_name": "Hinman Dining Hall",
        "site_id": "74015007",
        "location_id": "16976",
    },
    "ciw": {
        "key": "ciw",
        "display_name": "CIW Dining Hall",
        "site_id": "74015005",
        "location_id": "17395",
    },
    "c4": {
        "key": "c4",
        "display_name": "C4 Dining Hall",
        "site_id": "74015006",
        "location_id": "18060",
    },
    "appalachian": {
        "key": "appalachian",
        "display_name": "Appalachian Dining Hall",
        "site_id": "74015009",
        "location_id": "17338",
    },
}

_HALL_ALIASES = {
    "hinman": "hinman",
    "hinmandining": "hinman",
    "hinmandininghall": "hinman",
    "ciw": "ciw",
    "collegeinthewoods": "ciw",
    "collegeinthewoodsdininghall": "ciw",
    "c4": "c4",
    "chenangochamplaincollegiatecenter": "c4",
    "chenangochamplain": "c4",
    "app": "appalachian",
    "acc": "appalachian",
    "appalachian": "appalachian",
    "appalachiandining": "appalachian",
    "appalachiandininghall": "appalachian",
    "mountainview": "appalachian",
}


def _normalize_token(value: str) -> str:
    return "".join(character for character in value.lower() if character.isalnum())


def _resolve_hall(hall: str) -> dict:
    token = _normalize_token(hall)
    if not token:
        raise ValueError("Hall is required.")

    hall_key = _HALL_ALIASES.get(token)
    if hall_key is None:
        raise ValueError(
            "Unsupported hall. Use one of: Hinman, CIW, C4, Appalachian/ACC."
        )

    return _HALLS[hall_key]


def _normalize_date(date_input: Optional[str]) -> date_cls:
    if date_input is None or not date_input.strip():
        return datetime.now(_BINGHAMTON_TIMEZONE).date()

    value = date_input.strip()
    supported_formats = ("%Y-%m-%d", "%m-%d-%Y", "%m/%d/%Y", "%Y/%m/%d")

    for current_format in supported_formats:
        try:
            return datetime.strptime(value, current_format).date()
        except ValueError:
            continue

    raise ValueError(
        "Invalid date format. Use YYYY-MM-DD, MM-DD-YYYY, MM/DD/YYYY, or YYYY/MM/DD."
    )


async def _request_json(
    method: str, url: str, *, json_payload: Optional[dict] = None
) -> Any:
    headers = dict(_REQUEST_HEADERS)
    if json_payload is not None:
        headers["Content-Type"] = "application/json"

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT_SECONDS) as client:
        response = await client.request(
            method, url, headers=headers, json=json_payload
        )

    if response.status_code != 200:
        snippet = response.text.replace("\n", " ").strip()[:200]
        raise RuntimeError(f"Sodexo API error {response.status_code}: {snippet}")

    try:
        return response.json()
    except ValueError as exc:
        raise RuntimeError("Sodexo API returned a non-JSON response.") from exc


async def _fetch_menu_payload(hall_info: dict, date_iso: str) -> list:
    url = (
        f"{_SODEXO_BASE_URL}/data/menu/"
        f"{hall_info['site_id']}/{hall_info['location_id']}?date={date_iso}"
    )
    payload = await _request_json("GET", url)
    if not isinstance(payload, list):
        raise RuntimeError("Unexpected menu API response type.")
    return payload


async def _fetch_locations_composition(now_local: datetime) -> dict:
    payload = {
        "content": {
            "tenant": "binghamton",
            "localDateTime": now_local.strftime("%Y-%m-%dT%H:%M:%S"),
        },
        "globalization": {
            "language": "en",
            "country": "US",
            "locale": "en-US",
            "pathPrefix": "/en-us",
        },
        "request": {"uri": "/locations/"},
    }
    url = f"{_SODEXO_BASE_URL}/layout/getComposition"
    composition = await _request_json("POST", url, json_payload=payload)
    if not isinstance(composition, dict):
        raise RuntimeError("Unexpected composition API response type.")
    return composition


def _walk_fragments(regions: list[dict]) -> Iterable[dict]:
    for region in regions:
        for fragment in region.get("fragments", []) or []:
            yield fragment
        for nested_fragment in _walk_fragments(region.get("regions", []) or []):
            yield nested_fragment


def _find_hall_main_section(composition: dict, hall_info: dict) -> dict:
    subject = composition.get("subject", {})
    regions = subject.get("regions", []) or []

    for fragment in _walk_fragments(regions):
        content = fragment.get("content", {})
        main = content.get("main", {})
        menus = main.get("menus", []) or []
        for menu in menus:
            metadata = ((menu.get("content") or {}).get("metadata") or {})
            location_id = str(metadata.get("locationId", ""))
            menu_id = str(metadata.get("menuId", ""))
            if (
                location_id == hall_info["site_id"]
                and menu_id == hall_info["location_id"]
            ):
                return main

    raise RuntimeError("Unable to find hall metadata in composition payload.")


def _parse_iso_datetime_utc(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _sodexo_day_key(now_local: datetime) -> str:
    return str((now_local.weekday() + 1) % 7)


def _extract_today_hours(opening_hours: dict, now_local: datetime) -> list[dict]:
    seasonal = opening_hours.get("seasonalHours", []) or []
    now_utc = now_local.astimezone(timezone.utc)

    seasonal_blocks = []
    for entry in seasonal:
        start = _parse_iso_datetime_utc(entry.get("from"))
        end = _parse_iso_datetime_utc(entry.get("to"))
        if start is not None and end is not None and start <= now_utc <= end:
            seasonal_blocks.extend(entry.get("openingHours", []) or [])

    active_blocks = seasonal_blocks or (opening_hours.get("standardHours", []) or [])
    day_key = _sodexo_day_key(now_local)

    today_hours = []
    for block in active_blocks:
        days = block.get("days", []) or []
        if any(str(day.get("key")) == day_key for day in days):
            today_hours.extend(block.get("hours", []) or [])

    return today_hours


def _time_to_minutes_and_label(time_value: dict) -> tuple[int, str]:
    hour_raw = int(time_value.get("hour", "0"))
    minute_raw = int(time_value.get("minute", "0"))
    period = str(time_value.get("period", "AM")).upper()

    hour_24 = hour_raw % 12
    if period == "PM":
        hour_24 += 12

    minutes = hour_24 * 60 + minute_raw
    label = f"{hour_raw:02d}:{minute_raw:02d} {period}"
    return minutes, label


def _minutes_in_range(current: int, start: int, end: int) -> bool:
    if start == end:
        return True
    if start < end:
        return start <= current < end
    return current >= start or current < end


def _label_means_closed(label: str) -> bool:
    return "closed" in label.lower()


def _build_status_intervals(today_hours: list[dict], now_local: datetime) -> tuple[list[dict], bool, str]:
    now_minutes = now_local.hour * 60 + now_local.minute
    intervals = []
    segments = []
    is_open = False

    for hour_entry in today_hours:
        label = hour_entry.get("label")
        all_day = bool(hour_entry.get("allDay"))
        start = hour_entry.get("startTime")
        finish = hour_entry.get("finishTime")

        if all_day:
            interval_label = label if label else "Open 24 hours"
            intervals.append({"all_day": True, "label": interval_label})
            segments.append(interval_label)
            if not label or not _label_means_closed(label):
                is_open = True
            continue

        if isinstance(start, dict) and isinstance(finish, dict):
            start_minutes, start_label = _time_to_minutes_and_label(start)
            end_minutes, end_label = _time_to_minutes_and_label(finish)

            interval = {"start": start_label, "end": end_label}
            if label:
                interval["label"] = label
            intervals.append(interval)

            segment = f"{start_label}-{end_label}"
            if label:
                segment = f"{segment} ({label})"
            segments.append(segment)

            if _minutes_in_range(now_minutes, start_minutes, end_minutes):
                is_open = True
            continue

        if label:
            intervals.append({"label": label})
            segments.append(label)
        else:
            intervals.append({"label": "Closed"})
            segments.append("Closed")

    if not intervals:
        return [], False, "Closed"

    return intervals, is_open, "; ".join(segments)


def _to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() == "true"
    return bool(value)


def _normalize_menu_item(item: dict) -> dict:
    allergens = []
    for allergen in item.get("allergens", []) or []:
        if isinstance(allergen, dict):
            allergens.append(
                {
                    "id": allergen.get("allergen"),
                    "name": allergen.get("name"),
                    "contains": _to_bool(allergen.get("contains")),
                }
            )

    return {
        "menu_item_id": item.get("menuItemId"),
        "name": item.get("formalName"),
        "description": item.get("description"),
        "course": item.get("course"),
        "price": item.get("price"),
        "dietary_flags": {
            "vegan": _to_bool(item.get("isVegan")),
            "vegetarian": _to_bool(item.get("isVegetarian")),
            "mindful": _to_bool(item.get("isMindful")),
            "swell": _to_bool(item.get("isSwell")),
            "plant_based": _to_bool(item.get("isPlantBased")),
        },
        "allergens": allergens,
    }


def _normalize_menu_payload(raw_menu: list, hall_info: dict, date_iso: str) -> dict:
    meals = []
    station_count = 0
    item_count = 0

    for meal_entry in raw_menu:
        if not isinstance(meal_entry, dict):
            continue

        stations = []
        for group in meal_entry.get("groups", []) or []:
            if not isinstance(group, dict):
                continue
            normalized_items = [
                _normalize_menu_item(item)
                for item in (group.get("items", []) or [])
                if isinstance(item, dict)
            ]
            item_count += len(normalized_items)
            station_count += 1
            stations.append(
                {
                    "station_name": group.get("name"),
                    "items": normalized_items,
                }
            )

        meals.append({"meal_name": meal_entry.get("name"), "stations": stations})

    return {
        "hall": hall_info["display_name"],
        "site_id": hall_info["site_id"],
        "location_id": hall_info["location_id"],
        "date": date_iso,
        "summary": {
            "meal_count": len(meals),
            "station_count": station_count,
            "item_count": item_count,
        },
        "meals": meals,
        "source": "sodexo_menu_data",
    }


async def _fetch_dining(hall: str) -> dict:
    hall_info = _resolve_hall(hall)
    now_local = datetime.now(_BINGHAMTON_TIMEZONE)

    composition = await _fetch_locations_composition(now_local)
    hall_main = _find_hall_main_section(composition, hall_info)
    opening_hours = hall_main.get("openingHours", {})
    if not isinstance(opening_hours, dict):
        raise RuntimeError("Missing openingHours data for selected hall.")

    today_hours = _extract_today_hours(opening_hours, now_local)
    intervals, is_open, hours_text = _build_status_intervals(today_hours, now_local)

    return {
        "hall": hall_info["display_name"],
        "is_open": is_open,
        "hours": hours_text,
        "intervals": intervals,
        "timezone": "America/New_York",
        "source": "sodexo_layout_getComposition",
    }


async def _fetch_dining_menu(hall: str, date_iso: str) -> dict:
    hall_info = _resolve_hall(hall)
    raw_menu = await _fetch_menu_payload(hall_info, date_iso)
    return _normalize_menu_payload(raw_menu, hall_info, date_iso)


def register(mcp: FastMCP):
    @mcp.tool()
    async def get_dining_status(hall: str) -> dict:
        """
        Returns open/closed status and hours for a Binghamton University
        resident dining hall.

        Supported halls:
          - Hinman
          - CIW
          - C4
          - Appalachian (ACC)

        Args:
            hall: Name or abbreviation of the dining hall (case-insensitive).

        Returns on success:
            {
                "hall": str,
                "is_open": bool,
                "hours": str,
                "intervals": list[dict],
                "timezone": str,
                "source": str
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str,
                "hall": str
            }
        """
        cache_key = f"status:{hall.lower().strip()}"
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

    @mcp.tool()
    async def get_dining_menu(hall: str, date: str = "") -> dict:
        """
        Returns normalized Sodexo menu data for a Binghamton resident dining hall.

        Supported halls:
          - Hinman
          - CIW
          - C4
          - Appalachian (ACC)

        Args:
            hall: Name or abbreviation of the dining hall (case-insensitive).
            date: Optional target date. Accepted formats:
                  YYYY-MM-DD, MM-DD-YYYY, MM/DD/YYYY, YYYY/MM/DD.
                  Defaults to today's date in America/New_York.

        Returns on success:
            {
                "hall": str,
                "site_id": str,
                "location_id": str,
                "date": str,
                "summary": {
                    "meal_count": int,
                    "station_count": int,
                    "item_count": int
                },
                "meals": list[dict],
                "source": str
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str,
                "hall": str,
                "date": str
            }
        """
        try:
            normalized_date = _normalize_date(date).isoformat()
        except Exception as exc:
            return {
                "status": "unavailable",
                "reason": str(exc),
                "hall": hall,
                "date": date,
            }

        cache_key = f"menu:{hall.lower().strip()}:{normalized_date}"
        cached = get_cached("dining", cache_key)
        if cached is not None:
            return cached

        try:
            result = await _fetch_dining_menu(hall, normalized_date)
        except Exception as exc:
            return {
                "status": "unavailable",
                "reason": str(exc),
                "hall": hall,
                "date": normalized_date,
            }

        set_cached("dining", cache_key, result)
        return result
