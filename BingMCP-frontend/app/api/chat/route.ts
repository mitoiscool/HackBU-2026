import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, convertToModelMessages, stepCountIs } from "ai"
import { createMCPClient } from "@ai-sdk/mcp"

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

const model = google(process.env.GEMINI_MODEL ?? "gemini-3-flash-preview")

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:8000/sse"

export const maxDuration = 60

function logMCP(label: string, data?: unknown) {
    const ts = new Date().toISOString()
    if (data !== undefined) {
        console.log(`[BingMCP ${ts}] ${label}`, typeof data === "object" ? JSON.stringify(data, null, 2) : data)
    } else {
        console.log(`[BingMCP ${ts}] ${label}`)
    }
}

export async function POST(req: Request) {
    const { messages: uiMessages } = await req.json()
    const messages = await convertToModelMessages(uiMessages)

    logMCP("→ POST /api/chat", { messageCount: messages.length, mcpUrl: MCP_SERVER_URL })
    logMCP("Last user message", messages.at(-1))

    const connStart = Date.now()
    let mcpClient
    try {
        logMCP(`Connecting to MCP server at ${MCP_SERVER_URL} ...`)
        mcpClient = await createMCPClient({
            transport: { type: "sse", url: MCP_SERVER_URL },
            name: "baxter-frontend",
        })
        logMCP(`MCP connected in ${Date.now() - connStart}ms`)
    } catch (err) {
        logMCP(`MCP connection FAILED after ${Date.now() - connStart}ms — falling back to no-tools mode`, String(err))
        const result = streamText({
            model,
            system:
                "You are Baxter, a helpful campus assistant for Binghamton University students. " +
                "Be concise and direct — students are on the go. " +
                "Your campus tools are currently offline, so answer from general knowledge and let the student know the live data is unavailable.",
            messages,
        })
        return result.toUIMessageStreamResponse()
    }

    const toolsStart = Date.now()
    const tools = await mcpClient.tools()
    const toolNames = Object.keys(tools)
    logMCP(`Tools fetched in ${Date.now() - toolsStart}ms — available: [${toolNames.join(", ")}]`)

    let stepNum = 0
    const result = streamText({
        model,
        system:
            "You are Baxter, a helpful campus assistant for Binghamton University students. " +
            "Be concise and direct — students are on the go. " +
            "You have access to live campus tools — use them to give real-time info.",
        messages,
        tools,
        stopWhen: stepCountIs(5),
        // @ts-expect-error AI SDK types are out of sync with installed version
        onStepStart: (step) => {
            stepNum++
            logMCP(`Step ${stepNum} start`, { type: step.stepType })
        },
        onStepFinish: (step) => {
            if (step.toolCalls?.length) {
                for (const tc of step.toolCalls) {
                    logMCP(`  Tool called: ${tc.toolName}`, tc.input)
                }
            }
            if (step.toolResults?.length) {
                for (const tr of step.toolResults) {
                    // @ts-expect-error AI SDK types out of sync
                    logMCP(`  Tool result: ${tr.toolName}`, tr.result)
                }
            }
            if (step.text) {
                logMCP(`  Text chunk (${step.text.length} chars): "${step.text.slice(0, 120)}${step.text.length > 120 ? "…" : ""}"`)
            }
        },
        onError: (err) => {
            logMCP("streamText error", err)
        },
        onFinish: async () => {
            await mcpClient.close().catch(() => { })
            logMCP("MCP client closed")
        },
    })

    return result.toUIMessageStreamResponse()
}
