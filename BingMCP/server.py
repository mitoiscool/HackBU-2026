import importlib
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from mcp.server.fastmcp import FastMCP


def _log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[BingMCP {ts}] {msg}", file=sys.stderr, flush=True)


def load_tools_dynamically(mcp: FastMCP, tools_dir: str = "tools"):
    base_path = Path(__file__).parent
    tools_path = base_path / tools_dir

    if not tools_path.exists():
        _log(f"Tools directory not found: {tools_path}")
        return

    if str(base_path) not in sys.path:
        sys.path.insert(0, str(base_path))

    loaded = []
    failed = []
    for tool_file in tools_path.glob("*/tool.py"):
        rel_path = tool_file.relative_to(base_path)
        module_name = str(rel_path.with_suffix("")).replace("/", ".").replace("\\", ".")

        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "register") and callable(module.register):
                module.register(mcp)
                loaded.append(module_name)
        except Exception as e:
            failed.append(module_name)
            _log(f"  FAILED to load {module_name}: {e}")

    _log(f"Tools loaded ({len(loaded)}): {', '.join(loaded)}")
    if failed:
        _log(f"Tools failed ({len(failed)}): {', '.join(failed)}")


def _patch_tools_with_logging(mcp: FastMCP) -> None:
    """Wrap each registered MCP tool so every call is logged to stderr."""
    tools = getattr(mcp, "_tools", None) or getattr(mcp, "tools", {})
    if callable(tools):
        # FastMCP exposes tools differently depending on version — skip patching
        # if we can't access the underlying dict directly.
        return
    for name, tool_obj in tools.items():
        original_fn = getattr(tool_obj, "fn", None)
        if original_fn is None:
            continue

        def make_wrapper(tool_name, fn):
            async def wrapper(*args, **kwargs):
                _log(f"TOOL CALL  ► {tool_name}  args={args}  kwargs={kwargs}")
                t0 = time.perf_counter()
                try:
                    result = await fn(*args, **kwargs)
                    elapsed = (time.perf_counter() - t0) * 1000
                    _log(f"TOOL RESULT ◄ {tool_name}  ({elapsed:.0f}ms)  → {str(result)[:200]}")
                    return result
                except Exception as exc:
                    elapsed = (time.perf_counter() - t0) * 1000
                    _log(f"TOOL ERROR  ✗ {tool_name}  ({elapsed:.0f}ms)  → {exc}")
                    raise
            return wrapper

        tool_obj.fn = make_wrapper(name, original_fn)


def main():
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))

    _log(f"Starting BingMCP SSE server on {host}:{port}")
    _log(f"SSE endpoint will be available at: http://{host}:{port}/sse")

    mcp = FastMCP("BingMCP", host=host, port=port)
    load_tools_dynamically(mcp)
    _patch_tools_with_logging(mcp)

    _log("Server ready — waiting for connections")
    mcp.run(transport="sse")


if __name__ == "__main__":
    main()
