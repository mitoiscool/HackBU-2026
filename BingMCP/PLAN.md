# BingMCP Tool Implementation Plan

## Context
The BingMCP server (`BingMCP/`) is a FastMCP SSE server. It auto-discovers tools by importing every `tools/*/tool.py` that exports a `register(mcp)` function. Stubs already exist for laundry, bus, and gym — each has a `_fetch_*()` placeholder and a fully-wired `register()` with caching and error handling. The library tool is entirely new. This document is self-contained: everything needed to implement all four tools is here.

---

## Phase 0: Endpoint Validation (Do This Before Any Code)

Run each curl below. Inspect the output and confirm the shape matches expectations. Note exact JSON field names — they drive the implementation mapping.

### 0a. Laundry (LaundryView)
```bash
curl -s "https://www.laundryview.com/api/currentRoomData?school_desc_key=8861&location=415890008" \
  | python3 -m json.tool | head -60
```
**Confirm:**
- Response has an `"objects"` array
- Each element has `"appliance_type"` (`"W"` = washer, `"D"` = dryer)
- Each element has `"time_left_lite"` (`"Available"` or a minutes string)

### 0b. Bus (OCCT ETA Spot)
```bash
curl -s "https://binghamtonupublic.etaspot.net/service.php?service=get_vehicles&includeETAData=1&inService=1&orderedETAArray=1&token=TESTING" \
  | python3 -m json.tool | head -80
```
**Confirm:**
- Top-level key containing the vehicle array (likely `"get_vehicles"`)
- Each vehicle: has `lat`, `lng`, route name field, and an ordered ETA array
- ETA array elements: note exact key names for `minutes` and stop name

### 0c. Gym (BingGym)
```bash
curl -s "https://binggym.com/api/gym" | python3 -m json.tool
```
**Confirm:**
- Has `"count"` (integer, number of people)
- Has `"percentage"` (capacity utilized)
- Note whether `"is_open"` or hours field exists — use it if present

### 0d. Library (LibCal)
```bash
curl -s -X POST "https://libcal.binghamton.edu/spaces/availability/grid" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "lid=4610&gid=7823&start=$(date +%Y-%m-%d)&end=$(date +%Y-%m-%d)" \
  | python3 -m json.tool | head -80
```
**Confirm:**
- Returns a list of slot objects
- Each slot has `"className"` (empty string `""` = available)
- Each slot has `"start"` and `"end"` timestamps
- Each slot has a room name field (likely `"title"` or `"name"`) — note exact key

---

## Phase 1: Files to Modify / Create

| File | Action |
|---|---|
| `BingMCP/tools/laundry/tool.py` | Replace `_fetch_laundry()` stub body |
| `BingMCP/tools/bus/tool.py` | Replace `_fetch_bus()` stub body |
| `BingMCP/tools/gym/tool.py` | Replace `_fetch_gym()` stub body |
| `BingMCP/cache.py` | Add `"library"` TTLCache entry |
| `BingMCP/tools/library/__init__.py` | Create (empty) |
| `BingMCP/tools/library/tool.py` | Create full new tool |

---

## Phase 2: Implementation

### 2a. Laundry — `tools/laundry/tool.py`

**API:** `GET https://www.laundryview.com/api/currentRoomData?school_desc_key=8861&location={LOCATION_ID}`

**Full location mapping** (add as module-level constant):
```python
import httpx
from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached

_LAUNDRY_BASE = "https://www.laundryview.com/api/currentRoomData"
_SCHOOL_KEY = "8861"
_HTTP_TIMEOUT = 15.0

LAUNDRY_CONFIG = {
    "windham_g14":      415890008,
    "bingham_122":      415890060,
    "brandywine_116a":  415890026,
    "broome_g18":       415890061,
    "cascade_g14":      415890006,
    "cayuga_209":       415890042,
    "choconut_116a":    415890029,
    "cleveland_lr":     415890055,
    "delaware_117":     415890062,
    "digman_g11":       415890032,
    "endicott_g26":     415890063,
    "glenwood_116a":    415890027,
    "hughes_a_b1":      415890005,
    "hughes_b_b7":      415890059,
    "hunter_g14":       415890007,
    "johnson_g25a":     415890049,
    "lehman_a_b1":      415890004,
    "lehman_b_b7":      415890058,
    "marcy_g14":        415890009,
    "mohawk_g05":       415890041,
    "nanticoke_116a":   415890028,
    "oconnor_g06":      415890065,
    "old_digman":       415890066,
    "oneida_111":       415890043,
    "onondaga":         415890044,
    "rafuse_124":       415890064,
    "roosevelt_a_b1":   415890002,
    "roosevelt_b_b7":   415890056,
    "seneca_107":       415890045,
    "smith_b_b7":       415890057,
    "smith_dorm_a_b1":  415890003,
}
```

**`_fetch_laundry(building)` replacement logic:**
```python
async def _fetch_laundry(building: str) -> dict:
    # Normalize input: lowercase, strip, replace spaces→underscore
    token = building.lower().strip().replace(" ", "_")
    location_id = LAUNDRY_CONFIG.get(token)
    if location_id is None:
        raise ValueError(f"Unknown building '{building}'. Valid keys: {list(LAUNDRY_CONFIG)}")

    url = f"{_LAUNDRY_BASE}?school_desc_key={_SCHOOL_KEY}&location={location_id}"
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(url)
    if response.status_code != 200:
        raise RuntimeError(f"LaundryView API error {response.status_code}")
    data = response.json()

    washers_avail = washers_total = dryers_avail = dryers_total = 0
    for machine in data.get("objects", []):
        atype = machine.get("appliance_type")
        available = machine.get("time_left_lite") == "Available"
        if atype == "W":
            washers_total += 1
            if available:
                washers_avail += 1
        elif atype == "D":
            dryers_total += 1
            if available:
                dryers_avail += 1

    return {
        "building": building,
        "washers": {"available": washers_avail, "total": washers_total},
        "dryers":  {"available": dryers_avail,  "total": dryers_total},
    }
```

`register()` is unchanged — keep the existing cache and error-handling wrapper.

---

### 2b. Bus — `tools/bus/tool.py`

**API:** `GET https://binghamtonupublic.etaspot.net/service.php?service=get_vehicles&includeETAData=1&inService=1&orderedETAArray=1&token=TESTING`
No auth required. Token `TESTING` provides full public access.

**Module-level additions:**
```python
import httpx

_BUS_URL = "https://binghamtonupublic.etaspot.net/service.php"
_BUS_PARAMS = {
    "service":        "get_vehicles",
    "includeETAData": "1",
    "inService":      "1",
    "orderedETAArray":"1",
    "token":          "TESTING",
}
_HTTP_TIMEOUT = 15.0
```

**`_fetch_bus()` replacement logic** (exact field names to be confirmed in Phase 0):
```python
async def _fetch_bus() -> dict:
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(_BUS_URL, params=_BUS_PARAMS)
    if response.status_code != 200:
        raise RuntimeError(f"ETA Spot API error {response.status_code}")
    data = response.json()

    routes = []
    for vehicle in data.get("get_vehicles", []):  # key confirmed in Phase 0
        eta_array = vehicle.get("orderedETAArray", [])
        next_eta = eta_array[0] if eta_array else {}
        routes.append({
            "name":                 vehicle.get("routeName", "Unknown"),  # field confirmed in Phase 0
            "next_arrival_minutes": next_eta.get("minutes", -1),          # field confirmed in Phase 0
            "current_stop":         next_eta.get("stopName", ""),         # field confirmed in Phase 0
            "lat":                  vehicle.get("lat"),
            "lng":                  vehicle.get("lng"),
        })
    return {"routes": routes}
```

`register()` is unchanged.

---

### 2c. Gym — `tools/gym/tool.py`

**API:** `GET https://binggym.com/api/gym`
Returns real-time East Gym occupancy. Key fields: `count` (people), `percentage` (capacity %).

**Module-level additions:**
```python
import httpx

_GYM_URL = "https://binggym.com/api/gym"
_HTTP_TIMEOUT = 15.0
```

**`_fetch_gym()` replacement logic:**
```python
async def _fetch_gym() -> dict:
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(_GYM_URL)
    if response.status_code != 200:
        raise RuntimeError(f"BingGym API error {response.status_code}")
    data = response.json()

    count      = data.get("count", 0)
    percentage = data.get("percentage", 0)
    # Use API's is_open if present; otherwise infer from count
    is_open    = data.get("is_open", count > 0)

    return {
        "capacity_percent": int(percentage),
        "is_open":          bool(is_open),
        "hours":            data.get("hours", ""),  # use if API provides it
        "count":            count,
    }
```

`register()` is unchanged.

---

### 2d. Cache — `cache.py`

Add one line to `_caches` dict:
```python
"library": TTLCache(maxsize=64, ttl=60),   # room slots refresh every ~30-60s
```

---

### 2e. Library — `tools/library/tool.py` (new file)

**API:**
- Endpoint: `POST https://libcal.binghamton.edu/spaces/availability/grid`
- Required header: `X-Requested-With: XMLHttpRequest` (missing → 403)
- Body (form-encoded): `lid`, `gid`, `start` (YYYY-MM-DD), `end` (YYYY-MM-DD)

**Full location/category config:**
```python
LIBRARY_CONFIG = {
    "bartle": {
        "lid": 4610,
        "categories": {
            "group_study":           7823,
            "third_floor_projects":  46677,
            "media_viewing":         30039,
            "fine_arts_study":       49381,
            "bloomberg":             7830,
        },
    },
    "science": {
        "lid": 4608,
        "categories": {
            "group_study":           7832,
            "collaboration_space":   26438,
        },
    },
    "udc": {
        "lid": 4611,
        "categories": {
            "group_study":           7835,
        },
    },
}
```

**Full file structure:**
```python
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx
from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached

_LIBCAL_URL = "https://libcal.binghamton.edu/spaces/availability/grid"
_LIBCAL_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded",
}
_HTTP_TIMEOUT = 20.0
_ET = ZoneInfo("America/New_York")

LIBRARY_CONFIG = { ... }  # as above


async def _fetch_library_rooms(library: str, category: str) -> dict:
    lib_key = library.lower().strip()
    cat_key = category.lower().strip().replace(" ", "_")

    lib_conf = LIBRARY_CONFIG.get(lib_key)
    if lib_conf is None:
        raise ValueError(f"Unknown library '{library}'. Use: {list(LIBRARY_CONFIG)}")
    gid = lib_conf["categories"].get(cat_key)
    if gid is None:
        raise ValueError(f"Unknown category '{category}' for {library}. Use: {list(lib_conf['categories'])}")

    now = datetime.now(_ET)
    today = now.date().isoformat()

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.post(
            _LIBCAL_URL,
            headers=_LIBCAL_HEADERS,
            data={"lid": lib_conf["lid"], "gid": gid, "start": today, "end": today},
        )
    if response.status_code != 200:
        raise RuntimeError(f"LibCal API error {response.status_code}")
    slots = response.json()

    available_rooms = set()
    for slot in slots:
        if slot.get("className", "x") != "":
            continue  # not available
        # Parse slot window and check if current time falls within it
        try:
            start_dt = datetime.fromisoformat(slot["start"]).replace(tzinfo=_ET)
            end_dt   = datetime.fromisoformat(slot["end"]).replace(tzinfo=_ET)
        except (KeyError, ValueError):
            continue
        if start_dt <= now <= end_dt:
            room_name = slot.get("title") or slot.get("name", "")  # key confirmed in Phase 0
            if room_name:
                available_rooms.add(room_name)

    return {
        "library":         library,
        "category":        category,
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
            library:  Library building — "bartle", "science", or "udc" (case-insensitive)
            category: Room category (varies by library):
                      bartle:  group_study, third_floor_projects, media_viewing,
                               fine_arts_study, bloomberg
                      science: group_study, collaboration_space
                      udc:     group_study

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
        cache_key = f"{library.lower().strip()}:{category.lower().strip()}"
        cached = get_cached("library", cache_key)
        if cached is not None:
            return cached

        try:
            result = await _fetch_library_rooms(library, category)
        except Exception as exc:
            return {"status": "unavailable", "reason": str(exc)}

        set_cached("library", cache_key, result)
        return result
```

---

## Phase 3: Verification (End-to-End)

```bash
cd BingMCP && ./run.sh   # server must start with no errors
```

Then via MCP client or direct tool calls:

| Tool | Test call | Expected |
|---|---|---|
| `get_laundry_availability` | `"windham_g14"` | `washers`/`dryers` with real counts |
| `get_laundry_availability` | `"xyz"` | `{"status": "unavailable", "reason": "..."}` |
| `get_bus_locations` | _(no args)_ | `routes` list with `lat`/`lng`, non-empty if buses running |
| `get_gym_capacity` | _(no args)_ | numeric `capacity_percent`, boolean `is_open` |
| `get_available_library_rooms` | `"bartle", "group_study"` | list of room name strings |
| `get_available_library_rooms` | `"bartle", "bad_category"` | `{"status": "unavailable", ...}` |
| Cache test | Call any tool twice rapidly | Second call returns instantly (cache hit) |
