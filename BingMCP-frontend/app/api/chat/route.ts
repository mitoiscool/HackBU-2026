import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, convertToModelMessages, stepCountIs } from "ai"
import { createMCPClient } from "@ai-sdk/mcp"

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

const model = google(process.env.GEMINI_MODEL ?? "gemini-2.5-flash-preview-04-17")

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:8000/sse"

export const maxDuration = 60

export async function POST(req: Request) {
    const { messages: uiMessages } = await req.json()
    const messages = await convertToModelMessages(uiMessages)

    let mcpClient
    try {
        mcpClient = await createMCPClient({
            transport: { type: "sse", url: MCP_SERVER_URL },
            name: "baxter-frontend",
        })
    } catch (err) {
        console.error("Failed to connect to MCP server:", err)
        // Fall back to no tools if MCP server is down
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

    try {
        const tools = await mcpClient.tools()

        const result = streamText({
            model,
            system:
                "You are Baxter, a helpful campus assistant for Binghamton University students. " +
                "Be concise and direct — students are on the go. " +
                "You have access to live campus tools — use them to give real-time info.",
            messages,
            tools,
            stopWhen: stepCountIs(5),
        })

        return result.toUIMessageStreamResponse()
    } finally {
        await mcpClient.close().catch(() => { })
    }
}
