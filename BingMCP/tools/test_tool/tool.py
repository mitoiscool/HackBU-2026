from mcp.server.fastmcp import FastMCP

def register(mcp: FastMCP):
    @mcp.tool()
    def test_tool(message: str) -> str:
        """
        A simple boilerplate test tool that echoes back a message.
        
        Args:
            message: The message to echo back.
        """
        return f"Hello from test_tool! You said: {message}"
