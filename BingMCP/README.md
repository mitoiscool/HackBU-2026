# BingMCP

BingMCP is a FastMCP server that exposes live Binghamton University data as tools for LLM clients.

## What It Provides

The server loads tools dynamically from `tools/*/tool.py` and currently exposes:

- `get_laundry_availability(building: str)`
- `get_bus_locations()`
- `get_dining_status(hall: str)`
- `get_dining_menu(hall: str, date?: str)`
- `get_gym_capacity()`
- `get_available_library_rooms(library?: str, category?: str)`

Each tool is wrapped with cache + graceful error handling. On fetch failures, tools return:

```json
{
  "status": "unavailable",
  "reason": "..."
}
```

## Project Layout

```text
BingMCP/
  server.py
  cache.py
  run.sh
  requirements.txt
  tools/
    bus/tool.py
    dining/tool.py
    gym/tool.py
    laundry/tool.py
    library/tool.py
    test_tool/tool.py
```

## Requirements

- Python 3.10+

Install dependencies:

```bash
cd BingMCP
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Or use the helper script:

```bash
cd BingMCP
chmod +x run.sh
./run.sh
```

## Running the Server

### Default mode: stdio

```bash
python server.py
```

### HTTP mode (Streamable HTTP transport)

```bash
python server.py --transport http
```

In HTTP mode, the server listens on:

- Host: `localhost`
- Port: `8000`
- MCP endpoint: `http://localhost:8000/mcp`

## Cache TTLs

Configured in `cache.py`:

- Bus: `20s`
- Laundry: `45s`
- Library: `60s`
- Gym: `120s`
- Dining: `300s`

## Tool Notes

### Laundry

- Upstream: LaundryView (`https://www.laundryview.com/api/currentRoomData`)
- Input must be one of the configured room keys in `tools/laundry/tool.py`

### Bus

- Upstream: ETA Spot (`https://binghamtonupublic.etaspot.net/service.php`)
- Returns route name, next arrival estimate, current stop, and coordinates

### Dining

- Upstream: Sodexo APIs (`data/menu` + `layout/getComposition`)
- Supported halls: `hinman`, `ciw`, `c4`, `appalachian` (plus aliases like `acc`)
- `get_dining_menu` accepts date formats:
  - `YYYY-MM-DD`
  - `MM-DD-YYYY`
  - `MM/DD/YYYY`
  - `YYYY/MM/DD`

### Gym

- Upstream: `https://binggym.com/api/gym`
- Returns occupancy percent, open/closed, and count

### Library

- Upstream: LibCal (`/spaces` + `/spaces/availability/grid`)
- Supported libraries and categories are defined in `tools/library/tool.py`

## Adding a New Tool

1. Create `tools/<name>/tool.py`
2. Export `register(mcp: FastMCP)`
3. Register one or more `@mcp.tool()` functions

`server.py` auto-loads any `tools/*/tool.py` file on startup.
