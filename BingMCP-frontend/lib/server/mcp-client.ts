import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"

export const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:8000/sse"

export type ToolResultMap = Record<string, unknown>
export type McpTools = Awaited<ReturnType<MCPClient["tools"]>>

type ToolExecutionOptions = {
  toolCallId: string
  messages: unknown[]
  abortSignal?: AbortSignal
}

type ExecutableTool = {
  execute?: (input: unknown, options: ToolExecutionOptions) => Promise<unknown> | AsyncIterable<unknown> | unknown
}

type ExecutableToolSet = Record<string, ExecutableTool>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function"
  )
}

async function settleToolExecution(result: Promise<unknown> | AsyncIterable<unknown> | unknown): Promise<unknown> {
  const awaited = await result
  if (!isAsyncIterable(awaited)) {
    return awaited
  }

  let lastChunk: unknown = null
  for await (const chunk of awaited) {
    lastChunk = chunk
  }

  return lastChunk
}

export function getErrorReason(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error
  }
  return "Unknown error"
}

export function parseToolResultPayload(raw: unknown): ToolResultMap {
  if (isRecord(raw) && Array.isArray(raw.content) && raw.content.length > 0) {
    const first = raw.content[0]
    if (isRecord(first) && typeof first.text === "string") {
      try {
        const parsed = JSON.parse(first.text)
        if (isRecord(parsed)) {
          return parsed
        }
        return { value: parsed }
      } catch {
        return { text: first.text }
      }
    }
  }

  if (isRecord(raw)) {
    return raw
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (isRecord(parsed)) {
        return parsed
      }
      return { value: parsed }
    } catch {
      return { text: raw }
    }
  }

  return { value: raw }
}

export async function connectMcpClient(name: string): Promise<MCPClient> {
  return createMCPClient({
    transport: { type: "sse", url: MCP_SERVER_URL },
    name,
  })
}

export async function closeMcpClient(client: MCPClient | null | undefined): Promise<void> {
  if (!client) return
  await client.close().catch(() => {})
}

export async function getMcpTools(client: MCPClient) {
  return client.tools()
}

export async function executeMcpTool(
  tools: McpTools,
  toolName: string,
  input: Record<string, unknown> = {}
): Promise<ToolResultMap> {
  const toolSet = tools as ExecutableToolSet
  const tool = toolSet[toolName]

  if (!tool?.execute) {
    throw new Error(`MCP tool '${toolName}' is not available.`)
  }

  const raw = await settleToolExecution(
    tool.execute(input, {
      toolCallId: `${toolName}-${Date.now()}`,
      messages: [],
    })
  )

  return parseToolResultPayload(raw)
}
