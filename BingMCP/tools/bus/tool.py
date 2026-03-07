import asyncio

import httpx
from mcp.server.fastmcp import FastMCP
from cache import get_cached, set_cached

_BUS_URL = "https://binghamtonupublic.etaspot.net/service.php"
_HTTP_TIMEOUT = 20.0

_VEHICLE_PARAMS = {
    "service": "get_vehicles",
    "includeETAData": "1",
    "inService": "1",
    "orderedETAArray": "1",
    "token": "TESTING",
}
_ROUTES_PARAMS = {
    "service": "get_routes",
    "token": "TESTING",
}
_STOPS_PARAMS = {
    "service": "get_stops",
    "token": "TESTING",
}

_REQUEST_HEADERS = {
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (compatible; BingMCP/1.0)",
}


async def _fetch_json(
    client: httpx.AsyncClient, params: dict[str, str], endpoint_name: str
) -> dict:
    response = await client.get(_BUS_URL, params=params, headers=_REQUEST_HEADERS)
    if response.status_code != 200:
        raise RuntimeError(f"ETA Spot {endpoint_name} API error {response.status_code}")
    try:
        payload = response.json()
    except ValueError as exc:
        raise RuntimeError(f"ETA Spot {endpoint_name} returned non-JSON data.") from exc
    if not isinstance(payload, dict):
        raise RuntimeError(f"ETA Spot {endpoint_name} returned an unexpected payload.")
    return payload


def _coerce_int(value, fallback: int = -1) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


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
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        vehicles_payload, routes_payload, stops_payload = await asyncio.gather(
            _fetch_json(client, _VEHICLE_PARAMS, "get_vehicles"),
            _fetch_json(client, _ROUTES_PARAMS, "get_routes"),
            _fetch_json(client, _STOPS_PARAMS, "get_stops"),
            return_exceptions=True,
        )

    if isinstance(vehicles_payload, Exception):
        raise vehicles_payload

    route_name_by_id: dict[str, str] = {}
    if isinstance(routes_payload, dict):
        for route in routes_payload.get("get_routes", []):
            if isinstance(route, dict) and "id" in route:
                route_name_by_id[str(route.get("id"))] = str(
                    route.get("name", "")
                ).strip()

    stop_name_by_id: dict[str, str] = {}
    if isinstance(stops_payload, dict):
        for stop in stops_payload.get("get_stops", []):
            if isinstance(stop, dict) and "id" in stop:
                stop_name_by_id[str(stop.get("id"))] = str(
                    stop.get("name", "")
                ).strip()

    routes = []
    for vehicle in vehicles_payload.get("get_vehicles", []):
        if not isinstance(vehicle, dict):
            continue

        eta_entries = vehicle.get("minutesToNextStops") or vehicle.get("orderedETAArray")
        if not isinstance(eta_entries, list):
            eta_entries = []
        next_eta = next(
            (entry for entry in eta_entries if isinstance(entry, dict)),
            {},
        )

        route_id = vehicle.get("routeID")
        route_id_token = str(route_id) if route_id is not None else ""
        route_name = route_name_by_id.get(route_id_token)
        if not route_name:
            route_name = f"Route {route_id_token}" if route_id_token else "Unknown Route"

        direction = str(vehicle.get("direction", "")).strip()
        if direction:
            route_name = f"{route_name} ({direction})"

        minutes = _coerce_int(next_eta.get("minutes"), fallback=-1)

        stop_id = next_eta.get("stopID")
        if stop_id is None:
            stop_id = vehicle.get("nextStopID")
        stop_name = stop_name_by_id.get(str(stop_id), "")

        routes.append(
            {
                "name": route_name,
                "next_arrival_minutes": minutes,
                "current_stop": stop_name,
                "lat": vehicle.get("lat"),
                "lng": vehicle.get("lng"),
            }
        )

    return {
        "routes": routes,
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
