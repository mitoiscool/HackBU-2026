# BingMCP

An MCP (Model Context Protocol) server that aggregates live Binghamton University campus data and exposes it as MCP tools. Any AI assistant can query real-time laundry availability, bus locations, dining hall status/hours, dining menus, and gym capacity.

## Structure

```
BingMCP/
  server.py             — FastMCP entry point, dynamic tool loader, SSE transport
  cache.py              — Shared TTL cache layer (per data source)
  requirements.txt      — Python dependencies
  run.sh                — Venv setup + server launch script
  tools/
    test_tool/tool.py   — Boilerplate example tool
    laundry/tool.py     — Washer/dryer availability by residential building
    bus/tool.py         — Campus bus locations and arrival estimates
    dining/tool.py      — Dining hall open status/hours + normalized Sodexo menu data
    gym/tool.py         — East Gym occupancy and hours
```

## Tools

| Tool | Args | Description |
|------|------|-------------|
| `get_laundry_availability` | `building: str` | Washer/dryer counts for Hinman, Newing, Dickinson, Mountainview, Hillside, CIW |
| `get_bus_locations` | — | Next arrivals for Inner Loop, Outer Loop, Night Owl, Express |
| `get_dining_status` | `hall: str` | Open/closed + today's hours/intervals for Hinman, CIW, C4, Appalachian (ACC) |
| `get_dining_menu` | `hall: str, date?: str` | Normalized Sodexo menu data for Hinman, CIW, C4, Appalachian |
| `get_gym_capacity` | — | East Gym (Events Center) occupancy and hours |

## Transport

The server runs as an **SSE HTTP server** on port 8000. Connect MCP clients to:

```
http://localhost:8000/sse
```

Port and host are configurable via environment variables:

```bash
HOST=0.0.0.0 PORT=8000 python server.py
```

## Cache TTLs

| Source  | TTL    |
|---------|--------|
| Bus     | 20s    |
| Laundry | 45s    |
| Gym     | 2 min  |
| Dining  | 5 min  |

## Dining API Schemas (Verified)

The dining tool currently makes **two** upstream Sodexo API calls.

### Hall Mapping

| Hall | Site ID | Location ID |
|------|---------|-------------|
| Hinman Dining Hall | `74015007` | `16976` |
| CIW Dining Hall | `74015005` | `17395` |
| C4 Dining Hall | `74015006` | `18060` |
| Appalachian Dining Hall (ACC) | `74015009` | `17338` |

### API 1: Menu Data

- Method: `GET`
- URL: `https://api-prd.sodexomyway.net/v0.2/data/menu/{SITE_ID}/{LOCATION_ID}?date={YYYY-MM-DD}`
- Required headers:
  - `API-Key: <key>`
  - `Accept: application/json,text/plain,*/*`
  - `User-Agent: ...`
  - `Referer: https://binghamton.sodexomyway.com/`
- Query params:
  - `date` (required by upstream; tool normalizes date formats before calling)

Request schema:

```http
GET /v0.2/data/menu/{SITE_ID}/{LOCATION_ID}?date=2026-03-07
```

Raw response schema (observed):

```json
[
  {
    "name": "BRUNCH",
    "groups": [
      {
        "name": "SAVORY",
        "sortOrder": 0,
        "items": [
          {
            "menuItemId": 7139657360,
            "formalName": "Cage Free Scrambled Eggs",
            "description": "Light and fluffy scrambled eggs...",
            "course": "SAVORY",
            "price": 0.0,
            "allergens": [{"allergen": 2, "name": "Egg", "contains": "true"}],
            "isVegan": false,
            "isVegetarian": true,
            "isMindful": false,
            "isSwell": false,
            "isPlantBased": false
          }
        ]
      }
    ]
  }
]
```

### API 2: Composition/Hours Data

- Method: `POST`
- URL: `https://api-prd.sodexomyway.net/v0.2/layout/getComposition`
- Required headers:
  - `API-Key: <key>`
  - `Content-Type: application/json`
  - `Accept: application/json,text/plain,*/*`
  - `User-Agent: ...`
  - `Referer: https://binghamton.sodexomyway.com/`

Request body schema:

```json
{
  "content": {
    "tenant": "binghamton",
    "localDateTime": "2026-03-07T15:00:00"
  },
  "globalization": {
    "language": "en",
    "country": "US",
    "locale": "en-US",
    "pathPrefix": "/en-us"
  },
  "request": {
    "uri": "/locations/"
  }
}
```

Response schema used by tool:

```json
{
  "subject": {
    "regions": [
      {
        "fragments": [
          {
            "type": "Location",
            "content": {
              "main": {
                "name": "Hinman Dining Hall",
                "menus": [
                  {
                    "content": {
                      "metadata": {
                        "locationId": "74015007",
                        "menuId": "16976"
                      }
                    }
                  }
                ],
                "openingHours": {
                  "standardHours": [
                    {
                      "days": [{"key": "1", "value": "Monday"}],
                      "hours": [
                        {
                          "allDay": false,
                          "startTime": {"hour": "08", "minute": "00", "period": "AM"},
                          "finishTime": {"hour": "08", "minute": "00", "period": "PM"},
                          "label": "Dinner"
                        }
                      ]
                    }
                  ],
                  "seasonalHours": [
                    {
                      "from": "2026-02-27T06:00:00Z",
                      "to": "2026-02-28T23:59:59Z",
                      "openingHours": []
                    }
                  ]
                }
              }
            }
          }
        ]
      }
    ]
  }
}
```

### Current Dining Tool Output Schemas

`get_dining_status(hall: str)` returns:

```json
{
  "hall": "Hinman Dining Hall",
  "is_open": true,
  "hours": "08:00 AM-08:00 PM",
  "intervals": [{"start": "08:00 AM", "end": "08:00 PM"}],
  "timezone": "America/New_York",
  "source": "sodexo_layout_getComposition"
}
```

`get_dining_menu(hall: str, date?: str)` returns:

```json
{
  "hall": "Hinman Dining Hall",
  "site_id": "74015007",
  "location_id": "16976",
  "date": "2026-03-07",
  "summary": {"meal_count": 3, "station_count": 17, "item_count": 91},
  "meals": [
    {
      "meal_name": "BRUNCH",
      "stations": [
        {
          "station_name": "SAVORY",
          "items": [
            {
              "menu_item_id": 7139657360,
              "name": "Cage Free Scrambled Eggs",
              "description": "...",
              "course": "SAVORY",
              "price": 0.0,
              "dietary_flags": {
                "vegan": false,
                "vegetarian": true,
                "mindful": false,
                "swell": false,
                "plant_based": false
              },
              "allergens": [{"id": 2, "name": "Egg", "contains": true}]
            }
          ]
        }
      ]
    }
  ],
  "source": "sodexo_menu_data"
}
```

### Verification Notes

- `GET data/menu/...` returns `401` without `API-Key`.
- `GET data/menu/...` returns `200` for all 4 halls with key.
- `POST layout/getComposition` returns `200` with key and includes resident dining hall `openingHours`.
- `date` is required by upstream menu API; missing date returns upstream `500`.

## Setup & Running

```bash
chmod +x run.sh  # only needed the first time
./run.sh
```

This creates `.venv`, installs dependencies from `requirements.txt`, and starts the SSE server.

Or run directly:

```bash
python server.py
```

## Adding / Updating Tools

Each tool file follows this pattern:

1. **`_fetch_*()`** — module-level async stub at the top of the file. This is the only function that needs to be updated with real API/scraping logic. Replace only the `return` statement.
2. **`register(mcp)`** — wires the tool into FastMCP with caching and error handling. Do not modify this.

All tools return a graceful `{"status": "unavailable", "reason": "..."}` dict on any failure — they never raise to the agent.

To add a new tool, create `tools/<name>/tool.py` with a `register(mcp: FastMCP)` function. It will be picked up automatically on next server start.
