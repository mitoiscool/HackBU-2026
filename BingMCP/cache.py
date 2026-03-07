"""
Shared TTL cache for BingMCP tools.

Each data source has its own TTLCache with a TTL matching how often
that data actually changes:
  - bus:     20s   (real-time vehicle positions)
  - laundry: 45s   (washer/dryer state)
  - gym:     120s  (headcount changes slowly)
  - library: 60s   (room slots refresh frequently)
  - dining:  300s  (hours/menu change rarely mid-service)

Usage from any tool file:
    from cache import get_cached, set_cached
"""

from cachetools import TTLCache

_caches: dict[str, TTLCache] = {
    "bus":     TTLCache(maxsize=128, ttl=20),
    "laundry": TTLCache(maxsize=128, ttl=45),
    "gym":     TTLCache(maxsize=128, ttl=120),
    "library": TTLCache(maxsize=64, ttl=60),
    "dining":  TTLCache(maxsize=128, ttl=300),
}


def get_cached(source: str, key: str):
    """
    Return the cached value for (source, key), or None if missing/expired.

    Uses .get() so expired or missing keys return None rather than raising KeyError.
    """
    cache = _caches.get(source)
    if cache is None:
        return None
    return cache.get(key)


def set_cached(source: str, key: str, value) -> None:
    """Store value in the cache for (source, key)."""
    cache = _caches.get(source)
    if cache is not None:
        cache[key] = value
