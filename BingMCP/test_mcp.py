"""
test_mcp.py — Integration test for the BingMCP Streamable HTTP server.

Run this WHILE the MCP server is running (python server.py --transport http):

    python test_mcp.py                      # test all tools with default args
    python test_mcp.py laundry windham_g14  # test one tool by name
    python test_mcp.py bus                  # test bus tool

Requires:  pip install mcp httpx
"""

import asyncio
import json
import sys

MCP_URL = "http://localhost:8000/mcp"


async def list_tools():
    """Connect to the MCP server and print every registered tool + schema."""
    from mcp.client.session import ClientSession
    from mcp.client.streamable_http import streamable_http_client

    print(f"\n{'='*60}")
    print(f"  BingMCP Tool Discovery  ({MCP_URL})")
    print(f"{'='*60}\n")

    async with streamable_http_client(MCP_URL) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools_resp = await session.list_tools()
            tools = tools_resp.tools
            print(f"Found {len(tools)} tool(s):\n")
            for tool in tools:
                print(f"  ► {tool.name}")
                if tool.description:
                    first_line = tool.description.strip().splitlines()[0]
                    print(f"      {first_line}")
                if tool.inputSchema and "properties" in tool.inputSchema:
                    for param, schema in tool.inputSchema["properties"].items():
                        desc = schema.get("description", schema.get("type", ""))
                        print(f"      param: {param}  — {desc}")
                print()
            return [t.name for t in tools]


async def call_tool(tool_name: str, args: dict):
    """Call a specific MCP tool and print the result."""
    from mcp.client.session import ClientSession
    from mcp.client.streamable_http import streamable_http_client

    print(f"\n{'─'*60}")
    print(f"  Calling tool: {tool_name}")
    print(f"  Args:         {json.dumps(args)}")
    print(f"{'─'*60}")

    async with streamable_http_client(MCP_URL) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, args)
            print(f"  Status: {'ERROR' if result.isError else 'OK'}")
            for content in result.content:
                if hasattr(content, "text"):
                    try:
                        parsed = json.loads(content.text)
                        print(f"  Result:\n{json.dumps(parsed, indent=4)}")
                    except json.JSONDecodeError:
                        print(f"  Result: {content.text}")
            return result


# Default test cases for each tool
DEFAULT_TESTS: list[tuple[str, dict]] = [
    ("get_laundry_availability", {"building": "windham_g14"}),
    ("get_bus_locations",        {}),
    ("get_gym_capacity",         {}),
    ("get_dining_status",        {"hall": "hinman"}),
    ("get_dining_menu",          {"hall": "hinman"}),
    ("get_available_library_rooms", {}),
    ("get_bengaged_events",      {"limit": 5}),
]


async def run_all():
    """Run the full test suite: discover tools, then call each with defaults."""
    try:
        tool_names = await list_tools()
    except Exception as e:
        print(f"\n[ERROR] Could not connect to MCP server at {MCP_URL}")
        print(f"        Make sure 'python server.py --transport http' is running first.")
        print(f"        Detail: {e}\n")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  Running default test calls")
    print(f"{'='*60}")

    for tool_name, args in DEFAULT_TESTS:
        if tool_name in tool_names:
            try:
                await call_tool(tool_name, args)
            except Exception as e:
                print(f"  [ERROR] {tool_name}: {e}")
        else:
            print(f"\n  [SKIP] {tool_name} — not registered on server")

    print(f"\n{'='*60}")
    print("  All tests done.")
    print(f"{'='*60}\n")


async def run_single(tool_name: str, *extra_args: str):
    """Call one tool, parsing extra CLI args as 'key=value' pairs."""
    args: dict = {}
    for arg in extra_args:
        if "=" in arg:
            k, _, v = arg.partition("=")
            args[k] = v
        else:
            # Positional: match against known parameter names
            defaults = {name: a for name, a in DEFAULT_TESTS}
            if tool_name in defaults:
                known_keys = list(defaults[tool_name].keys())
                idx = list(extra_args).index(arg)
                if idx < len(known_keys):
                    args[known_keys[idx]] = arg

    # Fall back to defaults if no args supplied
    if not args:
        for name, default_args in DEFAULT_TESTS:
            if name == tool_name:
                args = default_args
                break

    try:
        await call_tool(tool_name, args)
    except Exception as e:
        print(f"\n[ERROR] Could not connect to MCP server at {MCP_URL}")
        print(f"        Make sure 'python server.py --transport http' is running first.")
        print(f"        Detail: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) == 1:
        asyncio.run(run_all())
    else:
        tool = sys.argv[1]
        rest = sys.argv[2:]
        asyncio.run(run_single(tool, *rest))
