import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText, convertToModelMessages, stepCountIs } from "ai"
import {
    getBuildingLabel,
    getDietaryPreferenceLabels,
    getDiningHallLabel,
    normalizePreferences,
    type NormalizedPreferences,
    type PreferencesInput,
} from "@/lib/preferences"
import { MCP_SERVER_URL, closeMcpClient, connectMcpClient, getMcpTools } from "@/lib/server/mcp-client"
import { getBinghamtonWeather, type WeatherSnapshot } from "@/lib/server/weather"

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

const model = google(process.env.GEMINI_MODEL ?? "gemini-3-flash-preview")

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
    const dietaryPreferenceLabels = getDietaryPreferenceLabels(preferences.dietaryPreferences)
    const dietaryPreferenceValues = preferences.dietaryPreferences ?? []

    if (!buildingLabel && !diningHallLabel && dietaryPreferenceLabels.length === 0) {
        return ""
    }

    const lines = ["Student profile preferences:"]
    if (buildingLabel && preferences.building) {
        lines.push(`- Laundry room: ${buildingLabel} (${preferences.building}).`)
    }
    if (diningHallLabel && preferences.preferredDiningHall) {
        lines.push(`- Preferred dining hall: ${diningHallLabel} (${preferences.preferredDiningHall}).`)
    }
    if (dietaryPreferenceLabels.length > 0 && dietaryPreferenceValues.length > 0) {
        lines.push(
            `- Dietary preferences: ${dietaryPreferenceLabels.join(", ")} (${dietaryPreferenceValues.join(", ")}).`
        )
    }
    lines.push(
        "Use this profile to personalize recommendations and to choose default laundry room or hall arguments when the user request does not specify one."
    )
    lines.push(
        "When discussing dining menus, prioritize and filter menu suggestions to match the dietary preferences."
    )

    return lines.join("\n")
}

function buildWeatherContext(weather: WeatherSnapshot): string {
    if (weather.status === "ok") {
        return [
            "Current Binghamton weather:",
            `- Location: ${weather.location}.`,
            `- Snapshot: ${weather.summary}.`,
            `- Observed at: ${weather.observedAt}.`,
            "Use this context for outdoor plans, commute timing, and gear suggestions when relevant.",
        ].join("\n")
    }

    return `Current Binghamton weather is unavailable (${weather.reason}). Do not invent live weather conditions.`
}

function buildSystemPrompt({
    toolsOnline,
    preferences,
    weather,
}: {
    toolsOnline: boolean
    preferences: NormalizedPreferences
    weather: WeatherSnapshot
}): string {
    const basePrompt =
        "You are Baxter, a helpful campus assistant for Binghamton University students. " +
        "Be concise and direct — students are on the go. " +
        (toolsOnline
            ? "You have access to live campus tools — use them to give real-time info."
            : "Your campus tools are currently offline, so answer from general knowledge and let the student know the live data is unavailable.")

    const preferenceContext = buildPreferenceContext(preferences)
    const weatherContext = buildWeatherContext(weather)
    const extraSections = [preferenceContext, weatherContext].filter((section) => section.trim().length > 0)
    if (extraSections.length === 0) {
        return basePrompt
    }

    return `${basePrompt}\n\n${extraSections.join("\n\n")}`
}

export async function POST(req: Request) {
    const { messages: uiMessages, preferences: rawPreferences } = await req.json()
    const preferences = normalizePreferences(
        rawPreferences && typeof rawPreferences === "object"
            ? (rawPreferences as PreferencesInput)
            : undefined
    )
    const messages = await convertToModelMessages(uiMessages)
    const weather = await getBinghamtonWeather()

    logMCP("→ POST /api/chat", { messageCount: messages.length, mcpUrl: MCP_SERVER_URL })
    if (preferences.building || preferences.preferredDiningHall || preferences.dietaryPreferences?.length) {
        logMCP("User preferences", preferences)
    }
    logMCP("Weather snapshot", weather.status === "ok" ? weather.summary : `unavailable: ${weather.reason}`)
    logMCP("Last user message", messages.at(-1))

    const connStart = Date.now()
    let mcpClient
    try {
        logMCP(`Connecting to MCP server at ${MCP_SERVER_URL} ...`)
        mcpClient = await connectMcpClient("baxter-frontend")
        logMCP(`MCP connected in ${Date.now() - connStart}ms`)
    } catch (err) {
        logMCP(`MCP connection FAILED after ${Date.now() - connStart}ms — falling back to no-tools mode`, String(err))
        const result = streamText({
            model,
            system: buildSystemPrompt({ toolsOnline: false, preferences, weather }),
            messages,
        })
        return result.toUIMessageStreamResponse()
    }

    const toolsStart = Date.now()
    const tools = await getMcpTools(mcpClient)
    const toolNames = Object.keys(tools)
    logMCP(`Tools fetched in ${Date.now() - toolsStart}ms — available: [${toolNames.join(", ")}]`)

    let stepNum = 0
    const result = streamText({
        model,
        system: buildSystemPrompt({ toolsOnline: true, preferences, weather }),
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
            await closeMcpClient(mcpClient)
            logMCP("MCP client closed")
        },
    })

    return result.toUIMessageStreamResponse()
}
