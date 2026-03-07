# BingMCP

A boilerplate Model Context Protocol (MCP) server written in Python.

## Structure

- `server.py`: The entry point for the MCP server.
- `tools/test_tool/tool.py`: A boilerplate example of a modular tool implementation.

## Setup & Running

This server uses standard Python virtual environments. Just run the script:

```bash
chmod +x run.sh  # only needed the first time
./run.sh
```

This will automatically create `.venv` using standard `python3 -m venv`, install dependencies from `requirements.txt` via `pip`, and start the MCP server.
