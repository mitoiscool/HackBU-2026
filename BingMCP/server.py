import argparse
import inspect
import importlib
import sys
import time
from collections.abc import Callable
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
import anyio
from mcp.server.fastmcp import FastMCP

LifecycleHook = Callable[[], object]


def _log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[BingMCP {ts}] {msg}", file=sys.stderr, flush=True)


def load_tools_dynamically(
    mcp: FastMCP, tools_dir: str = "tools"
) -> tuple[list[LifecycleHook], list[LifecycleHook]]:
    base_path = Path(__file__).parent
    tools_path = base_path / tools_dir

    if not tools_path.exists():
        _log(f"Tools directory not found: {tools_path}")
        return [], []

    if str(base_path) not in sys.path:
        sys.path.insert(0, str(base_path))

    loaded = []
    failed = []
    startup_hooks: list[LifecycleHook] = []
    shutdown_hooks: list[LifecycleHook] = []
    for tool_file in tools_path.glob("*/tool.py"):
        rel_path = tool_file.relative_to(base_path)
        module_name = str(rel_path.with_suffix("")).replace("/", ".").replace("\\", ".")

        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "register") and callable(module.register):
                module.register(mcp)
                loaded.append(module_name)

                startup_hook = getattr(module, "startup", None)
                if callable(startup_hook):
                    startup_hooks.append(startup_hook)

                shutdown_hook = getattr(module, "shutdown", None)
                if callable(shutdown_hook):
                    shutdown_hooks.append(shutdown_hook)
        except Exception as e:
            failed.append(module_name)
            _log(f"  FAILED to load {module_name}: {e}")

    _log(f"Tools loaded ({len(loaded)}): {', '.join(loaded)}")
    if failed:
        _log(f"Tools failed ({len(failed)}): {', '.join(failed)}")
    _log(
        "Lifecycle hooks discovered "
        f"(startup={len(startup_hooks)}, shutdown={len(shutdown_hooks)})"
    )

    return startup_hooks, shutdown_hooks


async def _run_lifecycle_hooks(hooks: list[LifecycleHook], phase: str) -> None:
    for hook in hooks:
        hook_name = getattr(hook, "__name__", repr(hook))
        try:
            result = hook()
            if inspect.isawaitable(result):
                await result
            _log(f"{phase} hook OK: {hook_name}")
        except Exception as exc:
            _log(f"{phase} hook FAILED: {hook_name} ({exc})")


class _LifecycleRunner:
    def __init__(
        self, startup_hooks: list[LifecycleHook], shutdown_hooks: list[LifecycleHook]
    ) -> None:
        self.startup_hooks = startup_hooks
        self.shutdown_hooks = shutdown_hooks
        self._startup_completed = False
        self._shutdown_completed = False

    async def run_startup(self) -> None:
        if self._startup_completed:
            return
        await _run_lifecycle_hooks(self.startup_hooks, "startup")
        self._startup_completed = True
        self._shutdown_completed = False

    async def run_shutdown(self) -> None:
        if not self._startup_completed or self._shutdown_completed:
            return
        await _run_lifecycle_hooks(list(reversed(self.shutdown_hooks)), "shutdown")
        self._shutdown_completed = True


def _create_lifespan(lifecycle_runner: _LifecycleRunner):
    @asynccontextmanager
    async def lifespan(_: FastMCP):
        await lifecycle_runner.run_startup()
        try:
            yield
        finally:
            await lifecycle_runner.run_shutdown()

    return lifespan


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


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the BingMCP server.")
    parser.add_argument(
        "--transport",
        choices=("stdio", "http"),
        default="stdio",
        help="Transport to run: stdio (default) or Streamable HTTP.",
    )
    return parser.parse_args()


def main():
    args = _parse_args()
    startup_hooks: list[LifecycleHook] = []
    shutdown_hooks: list[LifecycleHook] = []
    lifecycle_runner = _LifecycleRunner(startup_hooks, shutdown_hooks)
    lifespan = _create_lifespan(lifecycle_runner)

    if args.transport == "http":
        host = "localhost"
        port = 8000
        _log(f"Starting BingMCP Streamable HTTP server on {host}:{port}")
        _log(f"HTTP endpoint will be available at: http://{host}:{port}/mcp")
        mcp = FastMCP("BingMCP", host=host, port=port, lifespan=lifespan)
    else:
        _log("Starting BingMCP stdio server")
        mcp = FastMCP("BingMCP", lifespan=lifespan)

    loaded_startup_hooks, loaded_shutdown_hooks = load_tools_dynamically(mcp)
    startup_hooks.extend(loaded_startup_hooks)
    shutdown_hooks.extend(loaded_shutdown_hooks)
    _patch_tools_with_logging(mcp)

    anyio.run(lifecycle_runner.run_startup)
    _log("Server ready — waiting for connections")
    try:
        if args.transport == "http":
            mcp.run(transport="streamable-http")
        else:
            mcp.run()
    finally:
        anyio.run(lifecycle_runner.run_shutdown)


if __name__ == "__main__":
    main()
