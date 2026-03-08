import asyncio
import html
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

_BENGAGED_BASE_URL = "https://bengaged.binghamton.edu"
_EVENTS_API_URL = f"{_BENGAGED_BASE_URL}/mobile_ws/v17/mobile_events_list"
_HTTP_TIMEOUT_SECONDS = 30.0
_PAGE_SIZE = 200
_MAX_PAGES = 50
_POLL_INTERVAL_SECONDS = 15 * 60

_REQUEST_HEADERS = {
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (compatible; BingMCP/1.0)",
}

_events_snapshot: list[dict[str, Any]] = []
_last_refreshed_at: str | None = None
_last_error: str | None = None
_stale = False
_refresh_task: asyncio.Task | None = None
_state_lock = asyncio.Lock()


def _strip_html(value: Any) -> str:
    if value is None:
        return ""

    text = str(value)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def _to_absolute_url(path_or_url: Any) -> str:
    if path_or_url is None:
        return ""

    value = str(path_or_url).strip()
    if not value:
        return ""
    if value.startswith(("http://", "https://")):
        return value
    if value.startswith("//"):
        return f"https:{value}"
    if not value.startswith("/"):
        value = f"/{value}"
    return f"{_BENGAGED_BASE_URL}{value}"


def _coerce_int(value: Any) -> int | None:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def _extract_tags(tags_html: Any) -> list[str]:
    if tags_html is None:
        return []

    raw = str(tags_html)
    matches = re.findall(
        r"<span[^>]*label-tag[^>]*>(.*?)</span>",
        raw,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not matches:
        matches = [raw]

    tags: list[str] = []
    seen: set[str] = set()
    for match in matches:
        tag = _strip_html(match)
        if not tag or tag in seen:
            continue
        seen.add(tag)
        tags.append(tag)
    return tags


def _normalize_event_row(row: dict[str, Any]) -> dict[str, Any] | None:
    if str(row.get("listingSeparator", "")).lower() == "true":
        return None

    fields = [field for field in str(row.get("fields", "")).split(",") if field]
    if not fields:
        return None

    values = {field: row.get(f"p{index}") for index, field in enumerate(fields)}
    if str(values.get("date_separator", "")).lower() == "true":
        return None

    event_id = str(values.get("eventId", "")).strip()
    name = _strip_html(values.get("eventName"))
    if not event_id or not name:
        return None

    return {
        "event_id": event_id,
        "event_uid": str(values.get("eventUid", "")).strip(),
        "name": name,
        "dates_text": _strip_html(values.get("eventDates")),
        "category": _strip_html(values.get("eventCategory")),
        "location": _strip_html(values.get("eventLocation")),
        "organization": _strip_html(values.get("clubName")),
        "attendees": _coerce_int(values.get("eventAttendees")),
        "url": _to_absolute_url(values.get("eventUrl")),
        "image_url": _to_absolute_url(values.get("eventPicture")),
        "timezone": _strip_html(values.get("eventTimezone")),
        "tags": _extract_tags(values.get("eventTags")),
    }


async def _fetch_events_page(
    client: httpx.AsyncClient, *, range_value: int, limit: int
) -> list[dict[str, Any]]:
    response = await client.get(
        _EVENTS_API_URL,
        params={"range": str(range_value), "limit": str(limit), "show": "upcoming"},
        headers=_REQUEST_HEADERS,
    )
    if response.status_code != 200:
        snippet = response.text.replace("\n", " ").strip()[:200]
        raise RuntimeError(f"B-Engaged API error {response.status_code}: {snippet}")

    try:
        payload = response.json()
    except ValueError as exc:
        raise RuntimeError("B-Engaged API returned non-JSON data.") from exc

    if not isinstance(payload, list):
        raise RuntimeError("B-Engaged API returned an unexpected payload.")

    return [row for row in payload if isinstance(row, dict)]


async def _fetch_all_upcoming_events() -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    range_value = 0

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT_SECONDS) as client:
        for _ in range(_MAX_PAGES):
            rows = await _fetch_events_page(
                client, range_value=range_value, limit=_PAGE_SIZE
            )
            if not rows:
                break

            for row in rows:
                event = _normalize_event_row(row)
                if event is None:
                    continue
                event_id = event["event_id"]
                if event_id in seen_ids:
                    continue
                seen_ids.add(event_id)
                events.append(event)

            range_value += _PAGE_SIZE

    return events


def _event_matches_query(event: dict[str, Any], query: str) -> bool:
    haystack = " ".join(
        [
            str(event.get("name", "")),
            str(event.get("dates_text", "")),
            str(event.get("category", "")),
            str(event.get("location", "")),
            str(event.get("organization", "")),
            str(event.get("timezone", "")),
            " ".join(str(tag) for tag in event.get("tags", [])),
        ]
    ).lower()
    return query in haystack


def _normalize_paging(limit: int, offset: int) -> tuple[int, int]:
    if limit < 1 or limit > 500:
        raise ValueError("limit must be between 1 and 500.")
    if offset < 0:
        raise ValueError("offset must be greater than or equal to 0.")
    return limit, offset


async def _refresh_snapshot_once() -> None:
    global _events_snapshot, _last_refreshed_at, _last_error, _stale
    events = await _fetch_all_upcoming_events()
    refreshed_at = datetime.now(timezone.utc).isoformat()
    async with _state_lock:
        _events_snapshot = events
        _last_refreshed_at = refreshed_at
        _last_error = None
        _stale = False


async def _record_refresh_failure(exc: Exception) -> None:
    global _last_error, _stale
    async with _state_lock:
        _last_error = str(exc)
        if _events_snapshot:
            _stale = True


async def _poll_events_forever() -> None:
    while True:
        await asyncio.sleep(_POLL_INTERVAL_SECONDS)
        try:
            await _refresh_snapshot_once()
        except Exception as exc:
            await _record_refresh_failure(exc)


async def startup() -> None:
    global _refresh_task
    try:
        await _refresh_snapshot_once()
    except Exception as exc:
        await _record_refresh_failure(exc)

    if _refresh_task is None or _refresh_task.done():
        _refresh_task = asyncio.create_task(
            _poll_events_forever(),
            name="bengaged-events-poller",
        )


async def shutdown() -> None:
    global _refresh_task
    if _refresh_task is None:
        return

    task = _refresh_task
    _refresh_task = None
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


async def _query_cached_events(limit: int, offset: int, search: str = "") -> dict[str, Any]:
    async with _state_lock:
        snapshot = list(_events_snapshot)
        refreshed_at = _last_refreshed_at
        stale = _stale
        last_error = _last_error

    if not snapshot:
        reason = last_error or "B-Engaged events cache has not loaded yet."
        return {
            "status": "unavailable",
            "reason": reason,
        }

    query = search.strip().lower()
    if query:
        filtered = [event for event in snapshot if _event_matches_query(event, query)]
    else:
        filtered = snapshot

    total_events = len(filtered)
    page = filtered[offset : offset + limit]

    return {
        "source": "bengaged_mobile_ws_v17_mobile_events_list",
        "timeframe": "upcoming",
        "last_refreshed_at": refreshed_at,
        "stale": stale,
        "total_events": total_events,
        "offset": offset,
        "limit": limit,
        "returned_count": len(page),
        "has_more": offset + len(page) < total_events,
        "events": page,
        "last_error": last_error,
    }


def register(mcp: FastMCP):
    @mcp.tool()
    async def get_bengaged_events(
        limit: int = 100,
        offset: int = 0,
        search: str = "",
    ) -> dict:
        """
        Returns cached upcoming B-Engaged events from Binghamton University.

        Data is fetched in the background every 15 minutes and served from an
        in-memory snapshot for low-latency MCP responses.

        Args:
            limit: Number of events to return (1-500, default 100).
            offset: Zero-based index into the cached event list.
            search: Optional case-insensitive text filter.

        Returns on success:
            {
                "source": str,
                "timeframe": "upcoming",
                "last_refreshed_at": str | null,
                "stale": bool,
                "total_events": int,
                "offset": int,
                "limit": int,
                "returned_count": int,
                "has_more": bool,
                "events": list[dict]
            }

        Returns on failure:
            {
                "status": "unavailable",
                "reason": str
            }
        """
        try:
            normalized_limit, normalized_offset = _normalize_paging(limit, offset)
            return await _query_cached_events(normalized_limit, normalized_offset, search)
        except Exception as exc:
            return {
                "status": "unavailable",
                "reason": str(exc),
            }
