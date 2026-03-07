import importlib
import sys
from pathlib import Path
from mcp.server.fastmcp import FastMCP

def load_tools_dynamically(mcp: FastMCP, tools_dir: str = "tools"):
    base_path = Path(__file__).parent
    tools_path = base_path / tools_dir
    
    if not tools_path.exists():
        return
        
    if str(base_path) not in sys.path:
        sys.path.insert(0, str(base_path))

    for tool_file in tools_path.glob("*/tool.py"):
        rel_path = tool_file.relative_to(base_path)
        module_name = str(rel_path.with_suffix("")).replace("/", ".")
        module_name = module_name.replace("\\", ".")
        
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "register") and callable(module.register):
                module.register(mcp)
                print(f"Registered tool from: {module_name}", file=sys.stderr)
        except Exception as e:
            print(f"Failed to load tool {module_name}: {e}", file=sys.stderr)

def main():
    mcp = FastMCP("BingMCP")
    load_tools_dynamically(mcp)
    mcp.run()

if __name__ == "__main__":
    main()
