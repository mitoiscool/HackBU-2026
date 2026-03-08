import { createMCPClient, type MCPClient } from "@ai-sdk/mcp"

export const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:8000/mcp"

export type ToolResultMap = Record<string, unknown>
export type McpTools = Awaited<ReturnType<MCPClient["tools"]>>
type TransportType = "http" | "sse"
type TransportCandidate = {
  type: TransportType
  url: string
}

const PRELOADED_TOOLS = new WeakMap<MCPClient, McpTools>()

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

function replacePathSuffix(url: string, fromSuffix: string, toSuffix: string): string {
  if (!url.endsWith(fromSuffix)) {
    return url
  }
  return `${url.slice(0, -fromSuffix.length)}${toSuffix}`
}

function uniqueCandidates(candidates: TransportCandidate[]): TransportCandidate[] {
  const seen = new Set<string>()
  const result: TransportCandidate[] = []
  for (const candidate of candidates) {
    const key = `${candidate.type}:${candidate.url}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(candidate)
  }
  return result
}

function buildTransportCandidates(rawUrl: string): TransportCandidate[] {
  const configured = rawUrl.trim()
  if (configured.endsWith("/sse")) {
    return uniqueCandidates([
      { type: "sse", url: configured },
      { type: "http", url: replacePathSuffix(configured, "/sse", "/mcp") },
    ])
  }

  if (configured.endsWith("/mcp")) {
    return uniqueCandidates([
      { type: "http", url: configured },
      { type: "sse", url: replacePathSuffix(configured, "/mcp", "/sse") },
    ])
  }

  const trimmed = configured.replace(/\/+$/, "")
  return uniqueCandidates([
    { type: "http", url: `${trimmed}/mcp` },
    { type: "sse", url: `${trimmed}/sse` },
  ])
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
  const candidates = buildTransportCandidates(MCP_SERVER_URL)
  let lastError: unknown = null

  for (const candidate of candidates) {
    const client = await createMCPClient({
      transport: { type: candidate.type, url: candidate.url },
      name,
    })

    try {
      const tools = await client.tools()
      PRELOADED_TOOLS.set(client, tools)
      return client
    } catch (error) {
      lastError = error
      await client.close().catch(() => {})
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new Error(
    `Unable to connect to MCP server using: ${candidates
      .map((candidate) => `${candidate.type}:${candidate.url}`)
      .join(", ")}`
  )
}

export async function closeMcpClient(client: MCPClient | null | undefined): Promise<void> {
  if (!client) return
  await client.close().catch(() => {})
}

export async function getMcpTools(client: MCPClient) {
  const preloaded = PRELOADED_TOOLS.get(client)
  if (preloaded) {
    return preloaded
  }
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
