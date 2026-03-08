import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, convertToModelMessages, stepCountIs } from "ai"
import { createMCPClient } from "@ai-sdk/mcp"
import {
    getBuildingLabel,
    getDiningHallLabel,
    normalizePreferences,
    type NormalizedPreferences,
    type PreferencesInput,
} from "@/lib/preferences"

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

function buildPreferenceContext(preferences: NormalizedPreferences): string {
    const buildingLabel = getBuildingLabel(preferences.building)
    const diningHallLabel = getDiningHallLabel(preferences.preferredDiningHall)

    if (!buildingLabel && !diningHallLabel) {
        return ""
    }

    const lines = ["Student profile preferences:"]
    if (buildingLabel && preferences.building) {
        lines.push(`- Laundry room: ${buildingLabel} (${preferences.building}).`)
    }
    if (diningHallLabel && preferences.preferredDiningHall) {
        lines.push(`- Preferred dining hall: ${diningHallLabel} (${preferences.preferredDiningHall}).`)
    }
    lines.push(
        "Use this profile to personalize recommendations and to choose default laundry room or hall arguments when the user request does not specify one."
    )

    return lines.join("\n")
}

function buildSystemPrompt({
    toolsOnline,
    preferences,
}: {
    toolsOnline: boolean
    preferences: NormalizedPreferences
}): string {
    const basePrompt =
        "You are Baxter, a helpful campus assistant for Binghamton University students. " +
        "Be concise and direct — students are on the go. " +
        (toolsOnline
            ? "You have access to live campus tools — use them to give real-time info."
            : "Your campus tools are currently offline, so answer from general knowledge and let the student know the live data is unavailable.")

    const preferenceContext = buildPreferenceContext(preferences)
    if (!preferenceContext) {
        return basePrompt
    }

    return `${basePrompt}\n\n${preferenceContext}`
}

export async function POST(req: Request) {
    const { messages: uiMessages, preferences: rawPreferences } = await req.json()
    const preferences = normalizePreferences(
        rawPreferences && typeof rawPreferences === "object"
            ? (rawPreferences as PreferencesInput)
            : undefined
    )
    const messages = await convertToModelMessages(uiMessages)

    logMCP("→ POST /api/chat", { messageCount: messages.length, mcpUrl: MCP_SERVER_URL })
    if (preferences.building || preferences.preferredDiningHall) {
        logMCP("User preferences", preferences)
    }
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
            system: buildSystemPrompt({ toolsOnline: false, preferences }),
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
        system: buildSystemPrompt({ toolsOnline: true, preferences }),
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
