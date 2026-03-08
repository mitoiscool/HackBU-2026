"""
MCP Tool field validation tests.
Run from BingMCP/ directory: python test_tools.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from tools.bus.tool import _fetch_bus
from tools.gym.tool import _fetch_gym
from tools.laundry.tool import _fetch_laundry
from tools.library.tool import _fetch_library_rooms
from tools.dining.tool import _fetch_dining, _fetch_dining_menu
from tools.events.tool import _fetch_all_upcoming_events, _query_cached_events
import tools.events.tool as events_tool

PASS = "\033[32mPASS\033[0m"
FAIL = "\033[31mFAIL\033[0m"

results = []


def check(name: str, condition: bool, detail: str = ""):
    status = PASS if condition else FAIL
    msg = f"  [{status}] {name}"
    if detail:
        msg += f"  ({detail})"
    print(msg)
    results.append(condition)


def dump(data: dict):
    import json
    print(json.dumps(data, indent=2, default=str))


def validate_bus(data: dict):
    print("\n=== Bus ===")
    dump(data)
    check("top-level key 'routes'", "routes" in data)
    routes = data.get("routes", [])
    check("routes is a list", isinstance(routes, list))
    if routes:
        r = routes[0]
        check("route has 'name'", "name" in r, f"got: {list(r.keys())}")
        check("route has 'next_arrival_minutes'", "next_arrival_minutes" in r)
        check("route has 'current_stop'", "current_stop" in r)
        check("next_arrival_minutes is int", isinstance(r.get("next_arrival_minutes"), int))
    else:
        print("  (no active vehicles — skipping per-route field checks)")


def validate_gym(data: dict):
    print("\n=== Gym ===")
    dump(data)
    if data.get("status") == "unavailable":
        check("unavailable has 'reason'", "reason" in data)
        return
    check("has 'capacity_percent'", "capacity_percent" in data)
    check("has 'is_open'", "is_open" in data)
    check("capacity_percent is int", isinstance(data.get("capacity_percent"), int))
    check("is_open is bool", isinstance(data.get("is_open"), bool))


def validate_laundry(building: str, data: dict):
    print(f"\n=== Laundry ({building}) ===")
    dump(data)
    if data.get("status") == "unavailable":
        check("unavailable has 'reason'", "reason" in data)
        check("unavailable has 'building'", "building" in data)
        return
    check("has 'building'", "building" in data)
    check("has 'washers'", "washers" in data)
    check("has 'dryers'", "dryers" in data)
    for key in ("washers", "dryers"):
        group = data.get(key, {})
        check(f"{key} has 'available'", "available" in group)
        check(f"{key} has 'total'", "total" in group)
        check(f"{key}.available is int", isinstance(group.get("available"), int))
        check(f"{key}.total is int", isinstance(group.get("total"), int))


def validate_library(library: str, category: str, data: dict):
    print(f"\n=== Library ({library}/{category}) ===")
    dump(data)
    if data.get("status") == "unavailable":
        check("unavailable has 'reason'", "reason" in data)
        return
    check("has 'library'", "library" in data)
    check("has 'category'", "category" in data)
    check("has 'available_rooms'", "available_rooms" in data)
    check("available_rooms is list", isinstance(data.get("available_rooms"), list))
    rooms = data.get("available_rooms", [])
    if rooms:
        check("room names are strings", all(isinstance(r, str) for r in rooms))


def validate_dining_status(hall: str, data: dict):
    print(f"\n=== Dining Status ({hall}) ===")
    dump(data)
    if data.get("status") == "unavailable":
        check("unavailable has 'reason'", "reason" in data)
        check("unavailable has 'hall'", "hall" in data)
        return
    for field in ("hall", "is_open", "hours", "intervals", "timezone", "source"):
        check(f"has '{field}'", field in data)
    check("is_open is bool", isinstance(data.get("is_open"), bool))
    check("intervals is list", isinstance(data.get("intervals"), list))


def validate_dining_menu(hall: str, data: dict):
    print(f"\n=== Dining Menu ({hall}) ===")
    dump(data)
    if data.get("status") == "unavailable":
        check("unavailable has 'reason'", "reason" in data)
        check("unavailable has 'hall'", "hall" in data)
        return
    for field in ("hall", "site_id", "location_id", "date", "summary", "meals", "source"):
        check(f"has '{field}'", field in data)
    summary = data.get("summary", {})
    for s_field in ("meal_count", "station_count", "item_count"):
        check(f"summary has '{s_field}'", s_field in summary)
        check(f"summary.{s_field} is int", isinstance(summary.get(s_field), int))
    check("meals is list", isinstance(data.get("meals"), list))


def validate_events_fetch(events: list[dict]):
    print("\n=== Events Fetch (upcoming) ===")
    check("events payload is list", isinstance(events, list))
    check("events list is not empty", len(events) > 0, f"count={len(events)}")
    if not events:
        return

    sample = events[0]
    print(f"  sample event: {sample.get('name')} ({sample.get('event_id')})")
    for field in (
        "event_id",
        "event_uid",
        "name",
        "dates_text",
        "category",
        "location",
        "organization",
        "attendees",
        "url",
        "image_url",
        "timezone",
        "tags",
    ):
        check(f"event has '{field}'", field in sample)
    check("event_id is string", isinstance(sample.get("event_id"), str))
    check("name is string", isinstance(sample.get("name"), str))
    check("tags is list", isinstance(sample.get("tags"), list))


def validate_events_page(data: dict):
    print("\n=== Events Page ===")
    dump(data)
    if data.get("status") == "unavailable":
        check("unavailable has 'reason'", "reason" in data)
        return

    for field in (
        "source",
        "timeframe",
        "last_refreshed_at",
        "stale",
        "total_events",
        "offset",
        "limit",
        "returned_count",
        "has_more",
        "events",
    ):
        check(f"has '{field}'", field in data)
    check("events is list", isinstance(data.get("events"), list))
    check("returned_count matches list length", data.get("returned_count") == len(data.get("events", [])))
    check("has_more is bool", isinstance(data.get("has_more"), bool))


async def main():
    print("Running BingMCP field validation tests...\n")

    # Bus
    try:
        data = await _fetch_bus()
        validate_bus(data)
    except Exception as e:
        print(f"\n=== Bus ===\n  [{FAIL}] fetch raised: {e}")
        results.append(False)

    # Gym
    try:
        data = await _fetch_gym()
        validate_gym(data)
    except Exception as e:
        print(f"\n=== Gym ===\n  [{FAIL}] fetch raised: {e}")
        results.append(False)

    # Laundry
    for building in ("windham_g14", "cascade_g14"):
        try:
            data = await _fetch_laundry(building)
            validate_laundry(building, data)
        except Exception as e:
            print(f"\n=== Laundry ({building}) ===\n  [{FAIL}] fetch raised: {e}")
            results.append(False)

    # Library
    for library, category in [("bartle", "group_study"), ("science", "group_study")]:
        try:
            data = await _fetch_library_rooms(library, category)
            validate_library(library, category, data)
        except Exception as e:
            print(f"\n=== Library ({library}/{category}) ===\n  [{FAIL}] fetch raised: {e}")
            results.append(False)

    # Dining status
    for hall in ("hinman", "ciw"):
        try:
            data = await _fetch_dining(hall)
            validate_dining_status(hall, data)
        except Exception as e:
            print(f"\n=== Dining Status ({hall}) ===\n  [{FAIL}] fetch raised: {e}")
            results.append(False)

    # Dining menu
    for hall in ("hinman",):
        try:
            data = await _fetch_dining_menu(hall, "2026-03-07")
            validate_dining_menu(hall, data)
        except Exception as e:
            print(f"\n=== Dining Menu ({hall}) ===\n  [{FAIL}] fetch raised: {e}")
            results.append(False)

    # Events fetch + normalization
    try:
        events = await _fetch_all_upcoming_events()
        validate_events_fetch(events)
    except Exception as e:
        print(f"\n=== Events Fetch ===\n  [{FAIL}] fetch raised: {e}")
        results.append(False)

    # Events unavailable path when snapshot has not loaded
    async with events_tool._state_lock:
        snapshot_backup = list(events_tool._events_snapshot)
        refreshed_backup = events_tool._last_refreshed_at
        error_backup = events_tool._last_error
        stale_backup = events_tool._stale
        events_tool._events_snapshot = []
        events_tool._last_refreshed_at = None
        events_tool._last_error = "forced test cache miss"
        events_tool._stale = True

    try:
        unavailable = await _query_cached_events(limit=5, offset=0, search="")
        print("\n=== Events Unavailable Path ===")
        dump(unavailable)
        check("unavailable status", unavailable.get("status") == "unavailable")
        check("unavailable has reason", isinstance(unavailable.get("reason"), str))
    except Exception as e:
        print(f"\n=== Events Unavailable Path ===\n  [{FAIL}] query raised: {e}")
        results.append(False)
    finally:
        async with events_tool._state_lock:
            events_tool._events_snapshot = snapshot_backup
            events_tool._last_refreshed_at = refreshed_backup
            events_tool._last_error = error_backup
            events_tool._stale = stale_backup

    # Events paged output shape
    fixture_events = [
        {
            "event_id": "1",
            "event_uid": "uid-1",
            "name": "Alpha Event",
            "dates_text": "Mon, Mar 9, 2026 9:00 AM",
            "category": "Workshop",
            "location": "Library",
            "organization": "Org A",
            "attendees": 10,
            "url": "https://bengaged.binghamton.edu/rsvp_boot?id=1",
            "image_url": "https://bengaged.binghamton.edu/upload/a.png",
            "timezone": "EDT (GMT-4)",
            "tags": ["Academic"],
        },
        {
            "event_id": "2",
            "event_uid": "uid-2",
            "name": "Beta Event",
            "dates_text": "Tue, Mar 10, 2026 1:00 PM",
            "category": "Meeting",
            "location": "Union",
            "organization": "Org B",
            "attendees": 20,
            "url": "https://bengaged.binghamton.edu/rsvp_boot?id=2",
            "image_url": "https://bengaged.binghamton.edu/upload/b.png",
            "timezone": "EDT (GMT-4)",
            "tags": ["Community"],
        },
        {
            "event_id": "3",
            "event_uid": "uid-3",
            "name": "Gamma Event",
            "dates_text": "Wed, Mar 11, 2026 6:00 PM",
            "category": "Social",
            "location": "Online",
            "organization": "Org C",
            "attendees": 5,
            "url": "https://bengaged.binghamton.edu/rsvp_boot?id=3",
            "image_url": "https://bengaged.binghamton.edu/upload/c.png",
            "timezone": "EDT (GMT-4)",
            "tags": ["HackBU"],
        },
    ]

    async with events_tool._state_lock:
        snapshot_backup = list(events_tool._events_snapshot)
        refreshed_backup = events_tool._last_refreshed_at
        error_backup = events_tool._last_error
        stale_backup = events_tool._stale
        events_tool._events_snapshot = list(fixture_events)
        events_tool._last_refreshed_at = "2026-03-08T00:00:00+00:00"
        events_tool._last_error = None
        events_tool._stale = False

    try:
        paged = await _query_cached_events(limit=2, offset=1, search="")
        validate_events_page(paged)
        check("total_events equals fixture count", paged.get("total_events") == 3)
        check("offset respected", paged.get("offset") == 1)
        check("limit respected", paged.get("limit") == 2)
        check("paged returns two events", len(paged.get("events", [])) == 2)
        check("has_more false at end page", paged.get("has_more") is False)
    except Exception as e:
        print(f"\n=== Events Page ===\n  [{FAIL}] query raised: {e}")
        results.append(False)
    finally:
        async with events_tool._state_lock:
            events_tool._events_snapshot = snapshot_backup
            events_tool._last_refreshed_at = refreshed_backup
            events_tool._last_error = error_backup
            events_tool._stale = stale_backup

    passed = sum(results)
    total = len(results)
    print(f"\n{'='*40}")
    print(f"Results: {passed}/{total} checks passed")
    if passed < total:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
