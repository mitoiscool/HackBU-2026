"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { Bus, MoonStar, Dumbbell, CalendarDays, Paperclip, ArrowUp, User, Bot, Settings2, LayoutDashboard, Mic, MicOff, RotateCcw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScenarioCard, type Scenario } from "@/components/ui/scenario-card"
import { MarkdownMessage } from "@/components/ui/markdown-message"
import { ToolCallCard } from "@/features/chat/tool-calls"
import { TestMode } from "@/components/visuals/TestMode"
import { StatPanel, type StatEntry } from "@/features/chat/stat-panel/StatPanel"
import { BaxterOverlay, type BaxterOverlayPosition } from "@/components/baxter/BaxterOverlay"
import { MobileBottomTabs } from "@/components/navigation/MobileBottomTabs"
import { useChromeSpeechInput } from "@/features/chat/voice/useChromeSpeechInput"
import {
  BUILDING_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  DINING_HALL_OPTIONS,
  normalizePreferences,
  type BuildingPreference,
  type DietaryPreference,
  type DiningHallPreference,
} from "@/lib/preferences"
import type { StaticImageData } from "next/image"
import baxterdriving from "@/lib/images/baxter/baxterdriving.png"
import baxtersprinting from "@/lib/images/baxter/baxtersprinting.png"
import baxterlunch from "@/lib/images/baxter/baxterlunch.png"
import baxterdunkin from "@/lib/images/baxter/baxterdunkin.png"
import baxtermysterymeat from "@/lib/images/baxter/baxtermysterymeat.png"
import baxtergym from "@/lib/images/baxter/baxtergym.png"
import baxterlaundry from "@/lib/images/baxter/baxterlaundry.png"
import baxterreading from "@/lib/images/baxter/baxterreading.png"
import baxterlaptop from "@/lib/images/baxter/baxterlaptop.png"
import baxterthinking from "@/lib/images/baxter/baxterthinking.png"
import baxterjumping from "@/lib/images/baxter/baxterjumping.png"
import baxterfootball from "@/lib/images/baxter/baxterfootball.png"
import baxterice from "@/lib/images/baxter/baxterice.png"

const BAXTER_TOOL_IMAGES: Record<string, StaticImageData[]> = {
  get_bus_locations: [baxterdriving, baxtersprinting],
  get_dining_status: [baxterlunch, baxterdunkin],
  get_dining_menu: [baxtermysterymeat, baxterdunkin, baxterlunch],
  get_gym_capacity: [baxtergym],
  get_laundry_availability: [baxterlaundry],
  get_available_library_rooms: [baxterreading, baxterlaptop],
}

const BAXTER_FALLBACK_IMAGES: StaticImageData[] = [baxterthinking, baxterjumping, baxterfootball, baxterice]

function pickBaxterImage(toolName?: string | null): StaticImageData {
  const pool = toolName ? (BAXTER_TOOL_IMAGES[toolName] ?? BAXTER_FALLBACK_IMAGES) : BAXTER_FALLBACK_IMAGES
  return pool[Math.floor(Math.random() * pool.length)]
}

type BaxterInstance = {
  id: number
  position: BaxterOverlayPosition
  positionId: string
  src: StaticImageData
}

const BAXTER_POSITIONS: Array<BaxterOverlayPosition & { id: string }> = [
  { id: "upper-right", right: "3%", top: "10%" },
  { id: "upper-mid-right", right: "18%", top: "18%" },
  { id: "mid-right", right: "4%", top: "36%" },
  { id: "center-right", right: "20%", top: "48%" },
  { id: "lower-right", right: "6%", bottom: "20%" },
  { id: "lower-mid-right", right: "24%", bottom: "12%" },
  { id: "top-center", right: "34%", top: "8%" },
  { id: "bottom-center-right", right: "36%", bottom: "8%" },
]

const SCENARIOS: Scenario[] = [
  {
    icon: <Bus className="h-4 w-4" />,
    title: "Morning Rush",
    prompt: "What's the next bus I can catch? Is Hinman open for breakfast, and what are they serving this morning?",
    tools: ["get_bus_locations", "get_dining_status", "get_dining_menu"],
  },
  {
    icon: <Dumbbell className="h-4 w-4" />,
    title: "Workout & Refuel",
    prompt: "How packed is the East Gym right now? What's on the menu at CIW, and when's the next bus to get there?",
    tools: ["get_gym_capacity", "get_dining_menu", "get_bus_locations"],
  },
  {
    icon: <MoonStar className="h-4 w-4" />,
    title: "Late Night Grind",
    prompt: "It's 10:30 PM. Find me an open study room at Bartle and check if there are free washers in Digman.",
    tools: ["get_available_library_rooms", "get_laundry_availability"],
  },
  {
    icon: <CalendarDays className="h-4 w-4" />,
    title: "Weekend Planner",
    prompt: "What events are happening on campus today? Is C4 open for lunch, and are there any free washers nearby?",
    tools: ["get_bengaged_events", "get_dining_status", "get_laundry_availability"],
  },
]

// Easing curve for premium snappy feel
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: EASE, delay: 0.08 + i * 0.07 },
  }),
}

const userMessageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
}

const assistantMessageVariants = {
  hidden: { opacity: 0, x: -20, y: 6 },
  visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.38, ease: EASE } },
}

const MAX_FORCED_THINKING_MS = 12000
const WEATHER_REFRESH_MS = 10 * 60 * 1000

type WeatherPayload =
  | {
    status: "ok"
    location: string
    temperatureF: number
    condition: string
    observedAt: string
    summary: string
  }
  | {
    status: "unavailable"
    reason: string
  }

function getWeatherEmoji(condition: string): string {
  const normalized = condition.toLowerCase()
  if (normalized.includes("thunder")) return "⛈️"
  if (normalized.includes("snow")) return "❄️"
  if (normalized.includes("rain")) return "🌧️"
  if (normalized.includes("fog")) return "🌫️"
  if (normalized.includes("clear")) return "☀️"
  return "☁️"
}

type SettingsPopoverProps = {
  baxterEnabled: boolean
  onBaxterChange: (enabled: boolean) => void
  expandedToolCallsEnabled: boolean
  onExpandedToolCallsChange: (enabled: boolean) => void
  homeBuilding: BuildingPreference | ""
  onHomeBuildingChange: (building: BuildingPreference | "") => void
  preferredDiningHall: DiningHallPreference | ""
  onPreferredDiningHallChange: (hall: DiningHallPreference | "") => void
  dietaryPreferences: DietaryPreference[]
  onDietaryPreferencesChange: (dietaryPreferences: DietaryPreference[]) => void
  displayName: string
  onDisplayNameChange: (name: string) => void
}

function SettingsPopover({
  baxterEnabled,
  onBaxterChange,
  expandedToolCallsEnabled,
  onExpandedToolCallsChange,
  homeBuilding,
  onHomeBuildingChange,
  preferredDiningHall,
  onPreferredDiningHallChange,
  dietaryPreferences,
  onDietaryPreferencesChange,
  displayName,
  onDisplayNameChange,
}: SettingsPopoverProps) {
  const { theme, setTheme } = useTheme()
  const activeTheme = theme === "light" ? "light" : "dark"
  const selectClassName =
    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Open settings"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 max-w-[calc(100vw-1rem)] p-3">
        <div className="space-y-3">
          <div className="space-y-2">
            <DropdownMenuLabel className="px-0 py-0">Theme</DropdownMenuLabel>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
              <Button
                type="button"
                size="sm"
                variant={activeTheme === "dark" ? "default" : "ghost"}
                className="h-7 rounded-md"
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTheme === "light" ? "default" : "ghost"}
                className="h-7 rounded-md"
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <DropdownMenuLabel className="px-0 py-0">Baxter Mode</DropdownMenuLabel>
            <Button
              type="button"
              size="sm"
              variant={baxterEnabled ? "default" : "outline"}
              className="h-8 w-full justify-start rounded-md"
              onClick={() => onBaxterChange(!baxterEnabled)}
            >
              {baxterEnabled ? "On" : "Off"}
            </Button>
          </div>

          <div className="space-y-2">
            <DropdownMenuLabel className="px-0 py-0">Expanded Tool Calls</DropdownMenuLabel>
            <Button
              type="button"
              size="sm"
              variant={expandedToolCallsEnabled ? "default" : "outline"}
              className="h-8 w-full justify-start rounded-md"
              onClick={() => onExpandedToolCallsChange(!expandedToolCallsEnabled)}
            >
              {expandedToolCallsEnabled ? "On" : "Off"}
            </Button>
          </div>

          <div className="space-y-2">
            <DropdownMenuLabel className="px-0 py-0">Laundry Room</DropdownMenuLabel>
            <select
              value={homeBuilding}
              onChange={(event) => onHomeBuildingChange(event.target.value as BuildingPreference | "")}
              onKeyDown={(event) => event.stopPropagation()}
              className={selectClassName}
            >
              <option value="">Select your laundry room</option>
              {BUILDING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <DropdownMenuLabel className="px-0 py-0">Preferred Dining Hall</DropdownMenuLabel>
            <select
              value={preferredDiningHall}
              onChange={(event) => onPreferredDiningHallChange(event.target.value as DiningHallPreference | "")}
              onKeyDown={(event) => event.stopPropagation()}
              className={selectClassName}
            >
              <option value="">Select dining hall</option>
              {DINING_HALL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <DropdownMenuLabel className="px-0 py-0">Dietary Preferences</DropdownMenuLabel>
            <div className="grid grid-cols-1 gap-1.5">
              {DIETARY_PREFERENCE_OPTIONS.map((option) => {
                const isSelected = dietaryPreferences.includes(option.value)
                return (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className="h-8 w-full justify-start rounded-md"
                    onClick={() => {
                      const next = isSelected
                        ? dietaryPreferences.filter((value) => value !== option.value)
                        : [...dietaryPreferences, option.value]
                      onDietaryPreferencesChange(next)
                    }}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
            {dietaryPreferences.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-full justify-start rounded-md text-muted-foreground"
                onClick={() => onDietaryPreferencesChange([])}
              >
                Clear dietary filters
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <DropdownMenuLabel className="px-0 py-0">Name</DropdownMenuLabel>
            <Input
              value={displayName}
              onChange={(event) => onDisplayNameChange(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              className="h-8"
              placeholder="Enter your name"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ChatWindow() {
  const { messages, status, sendMessage, error } = useChat()
  const [input, setInput] = useState("")
  const [isTestModeEnabled, setIsTestModeEnabled] = useState(false)
  const [forcedThinkingExtraMs, setForcedThinkingExtraMs] = useState(0)
  const [baxterEnabled, setBaxterEnabled] = useState(false)
  const [expandedToolCallsEnabled, setExpandedToolCallsEnabled] = useState(true)
  const [homeBuilding, setHomeBuilding] = useState<BuildingPreference | "">("")
  const [preferredDiningHall, setPreferredDiningHall] = useState<DiningHallPreference | "">("")
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>([])
  const [displayName, setDisplayName] = useState("")
  const [weather, setWeather] = useState<WeatherPayload | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(true)
  const [baxterOverlays, setBaxterOverlays] = useState<BaxterInstance[]>([])
  const baxterOverlayIdRef = useRef(0)
  const baxterLastToolNameRef = useRef<string | null>(null)
  const baxterShouldShowAfterResponseRef = useRef(false)
  const baxterWasBusyRef = useRef(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const heroName = displayName.trim()

  // Track when each tool result first appeared so the timestamp is stable
  const statTimestampsRef = useRef<Map<string, number>>(new Map())

  const statEntries = useMemo((): StatEntry[] => {
    const latestByTool = new Map<string, StatEntry>()

    for (const msg of messages) {
      if (msg.role !== "assistant") continue
      for (const part of (msg.parts ?? [])) {
        if (!part.type.startsWith("tool-") && part.type !== "tool-invocation" && part.type !== "dynamic-tool") continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any
        const ti = p.toolInvocation || {}
        const toolName: string = p.toolName || ti.toolName || p.name || "unknown"
        const stateRaw = p.state || ti.state || (p.type === "tool-result" ? "result" : "call")
        if (stateRaw !== "result" && stateRaw !== "output-available") continue

        let result = p.output || p.result || ti.result
        if (result && typeof result === "object" && Array.isArray(result.content) && result.content.length > 0) {
          const text = result.content[0].text
          if (typeof text === "string") {
            try { result = JSON.parse(text) } catch { result = { text } }
          }
        }

        if (!result || (result as Record<string, unknown>).status === "unavailable") continue

        if (!statTimestampsRef.current.has(toolName)) {
          // Capture first-seen timestamp per tool for relative freshness display.
          statTimestampsRef.current.set(toolName, Date.now())
        }

        latestByTool.set(toolName, {
          id: toolName,
          toolName,
          result: result as Record<string, unknown>,
          timestamp: statTimestampsRef.current.get(toolName)!,
        })
      }
    }

    return Array.from(latestByTool.values())
  }, [messages])

  const isStreaming = status === "streaming" || status === "submitted"
  const {
    isSupported: isVoiceSupported,
    state: voiceState,
    error: voiceError,
    toggle: toggleVoiceInput,
    resetError: resetVoiceError,
  } = useChromeSpeechInput({
    value: input,
    onChange: setInput,
    disabled: isStreaming,
  })
  const voiceStatusText = voiceState === "listening"
    ? "Listening..."
    : voiceState === "processing"
      ? "Processing..."
      : voiceError
  const isVoiceActive = voiceState === "listening" || voiceState === "processing"
  const micButtonTitle = !isVoiceSupported
    ? "Voice input is available in Chrome-compatible browsers."
    : isVoiceActive
      ? "Stop voice input"
      : "Start voice input"
  const weatherPillLabel = isWeatherLoading
    ? "Checking Binghamton weather..."
    : weather?.status === "ok"
      ? `Binghamton now: ${getWeatherEmoji(weather.condition)} ${Math.round(weather.temperatureF)}°F`
      : "Binghamton weather unavailable"

  const { heroGreeting, heroSubline } = useMemo(() => {
    const hour = new Date().getHours()
    const name = displayName.trim()

    const condition = weather?.status === "ok" ? weather.condition.toLowerCase() : null
    const tempF = weather?.status === "ok" ? Math.round(weather.temperatureF) : null

    // Time-based greeting
    let greeting: string
    if (hour >= 5 && hour < 12) {
      greeting = name ? `Good morning, ${name}!` : "Good morning!"
    } else if (hour >= 12 && hour < 17) {
      greeting = name ? `Hey ${name}, afternoon!` : "Good afternoon!"
    } else if (hour >= 17 && hour < 21) {
      greeting = name ? `Evening, ${name}!` : "Good evening!"
    } else {
      greeting = name ? `Still up, ${name}?` : "Burning the midnight oil?"
    }

    // Weather-aware subline
    let subline = "What do you want to tackle on campus?"
    if (condition && tempF !== null) {
      if (condition.includes("snow")) {
        subline = "Bundle up before you head out today."
      } else if (condition.includes("thunder")) {
        subline = "Might be a good day to stay in and knock stuff out."
      } else if (condition.includes("rain")) {
        subline = "Don't forget your umbrella."
      } else if (condition.includes("fog")) {
        subline = "Foggy out there, good day to stay in and be productive."
      } else if (tempF <= 20) {
        subline = `It's ${tempF}°F so plan ahead before braving the cold.`
      } else if (tempF <= 35) {
        subline = `Pretty cold out there at ${tempF}°F, what do you need today?`
      } else if (tempF >= 80 && condition.includes("clear")) {
        subline = `Gorgeous ${tempF}°F day, get your errands done and go enjoy the sun!`
      } else if (hour >= 22 || hour < 5) {
        subline = "What do you need at this hour?"
      } else if (hour >= 5 && hour < 8) {
        subline = "Early start, let's make it count."
      }
    } else if (hour >= 22 || hour < 5) {
      subline = "What do you need at this hour?"
    } else if (hour >= 5 && hour < 8) {
      subline = "Early start, let's make it count."
    }

    return { heroGreeting: greeting, heroSubline: subline }
  }, [displayName, weather])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.shiftKey && event.key.toLowerCase() === "d") {
        setIsTestModeEnabled((prev) => !prev)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    let active = true

    const fetchWeather = async () => {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Weather request failed (${response.status})`)
        }

        const payload = (await response.json()) as WeatherPayload
        if (!active) return
        setWeather(payload)
      } catch (error) {
        if (!active) return
        setWeather({
          status: "unavailable",
          reason: error instanceof Error ? error.message : "Failed to load weather",
        })
      } finally {
        if (active) {
          setIsWeatherLoading(false)
        }
      }
    }

    void fetchWeather()
    const timer = window.setInterval(() => {
      void fetchWeather()
    }, WEATHER_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const spawnBaxterOverlay = useCallback((toolName?: string | null) => {
    setBaxterOverlays((current) => {
      const usedPositionIds = new Set(current.map((overlay) => overlay.positionId))
      const availablePositions = BAXTER_POSITIONS.filter((position) => !usedPositionIds.has(position.id))
      const positionPool = availablePositions.length > 0 ? availablePositions : BAXTER_POSITIONS
      const selectedPosition = positionPool[Math.floor(Math.random() * positionPool.length)]
      const { id: positionId, ...position } = selectedPosition

      return [
        ...current,
        {
          id: baxterOverlayIdRef.current++,
          position,
          positionId,
          src: pickBaxterImage(toolName),
        },
      ]
    })
  }, [])

  // Track the final tool used during a response without changing the visible overlay mid-stream.
  useEffect(() => {
    if (status !== "streaming") return

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistantMsg) return

    const toolParts = (lastAssistantMsg.parts ?? []).filter(
      (p) => p.type.startsWith("tool-") || p.type === "tool-invocation" || p.type === "dynamic-tool"
    )
    const lastToolPart = toolParts.at(-1)
    if (!lastToolPart) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = lastToolPart as any
    baxterLastToolNameRef.current = p.toolName || p.toolInvocation?.toolName || p.name || "unknown"
  }, [messages, status])

  useEffect(() => {
    const isBusy = status === "submitted" || status === "streaming"

    if (!isBusy && baxterWasBusyRef.current && baxterEnabled && baxterShouldShowAfterResponseRef.current) {
      spawnBaxterOverlay(baxterLastToolNameRef.current)
      baxterShouldShowAfterResponseRef.current = false
      baxterLastToolNameRef.current = null
    }

    baxterWasBusyRef.current = isBusy
  }, [baxterEnabled, spawnBaxterOverlay, status])

  useEffect(() => {
    let active = true

    Promise.resolve().then(() => {
      if (!active) return

      try {
        const storedBaxter = window.localStorage.getItem("baxter")
        if (storedBaxter === "true" || storedBaxter === "false") {
          const enabled = storedBaxter === "true"
          setBaxterEnabled(enabled)
          if (enabled) {
            spawnBaxterOverlay()
          }
        }

        const storedExpandedToolCalls = window.localStorage.getItem("expandedToolCalls")
        if (storedExpandedToolCalls === "true" || storedExpandedToolCalls === "false") {
          setExpandedToolCallsEnabled(storedExpandedToolCalls === "true")
        }

        const storedName = window.localStorage.getItem("name")
        if (typeof storedName === "string") {
          setDisplayName(storedName.trim())
        }

        const storedForcedThinkingExtraMs = window.localStorage.getItem("forcedThinkingExtraMs")
        if (storedForcedThinkingExtraMs) {
          const parsed = Number(storedForcedThinkingExtraMs)
          if (Number.isFinite(parsed) && parsed >= 0) {
            setForcedThinkingExtraMs(Math.min(MAX_FORCED_THINKING_MS, Math.round(parsed)))
          }
        }

        const storedDietaryPreferencesRaw = window.localStorage.getItem("dietaryPreferences")
        let storedDietaryPreferences: unknown = undefined
        if (storedDietaryPreferencesRaw) {
          try {
            storedDietaryPreferences = JSON.parse(storedDietaryPreferencesRaw)
          } catch {
            storedDietaryPreferences = undefined
          }
        }

        const normalized = normalizePreferences({
          building: window.localStorage.getItem("building") ?? undefined,
          preferredDiningHall: window.localStorage.getItem("preferredDiningHall") ?? undefined,
          dietaryPreferences: storedDietaryPreferences,
          dietaryPreference: window.localStorage.getItem("dietaryPreference") ?? undefined,
        })
        if (normalized.building) {
          setHomeBuilding(normalized.building)
        }
        if (normalized.preferredDiningHall) {
          setPreferredDiningHall(normalized.preferredDiningHall)
        }
        if (normalized.dietaryPreferences) {
          setDietaryPreferences(normalized.dietaryPreferences)
        }
      } catch {
        // Ignore localStorage access errors.
      }
    })

    return () => {
      active = false
    }
  }, [spawnBaxterOverlay])

  const handleBaxterChange = (enabled: boolean) => {
    setBaxterEnabled(enabled)
    baxterShouldShowAfterResponseRef.current = enabled && (status === "submitted" || status === "streaming")
    baxterLastToolNameRef.current = null

    if (enabled) {
      spawnBaxterOverlay()
    } else {
      setBaxterOverlays([])
    }

    try {
      window.localStorage.setItem("baxter", String(enabled))
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const handleExpandedToolCallsChange = (enabled: boolean) => {
    setExpandedToolCallsEnabled(enabled)
    try {
      window.localStorage.setItem("expandedToolCalls", String(enabled))
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const handleHomeBuildingChange = (building: BuildingPreference | "") => {
    setHomeBuilding(building)
    try {
      if (building) {
        window.localStorage.setItem("building", building)
      } else {
        window.localStorage.removeItem("building")
      }
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const handlePreferredDiningHallChange = (hall: DiningHallPreference | "") => {
    setPreferredDiningHall(hall)
    try {
      if (hall) {
        window.localStorage.setItem("preferredDiningHall", hall)
      } else {
        window.localStorage.removeItem("preferredDiningHall")
      }
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const handleDietaryPreferencesChange = (nextDietaryPreferences: DietaryPreference[]) => {
    setDietaryPreferences(nextDietaryPreferences)
    try {
      if (nextDietaryPreferences.length > 0) {
        window.localStorage.setItem("dietaryPreferences", JSON.stringify(nextDietaryPreferences))
      } else {
        window.localStorage.removeItem("dietaryPreferences")
      }
      // Remove legacy single-select key to avoid conflicting stale state.
      window.localStorage.removeItem("dietaryPreference")
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const handleDisplayNameChange = (name: string) => {
    setDisplayName(name)
    const trimmedName = name.trim()
    try {
      if (trimmedName.length > 0) {
        window.localStorage.setItem("name", trimmedName)
      } else {
        window.localStorage.removeItem("name")
      }
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const handleForcedThinkingExtraMsChange = (nextValue: number) => {
    const safeValue = Math.min(MAX_FORCED_THINKING_MS, Math.max(0, Math.round(nextValue)))
    setForcedThinkingExtraMs(safeValue)
    try {
      if (safeValue > 0) {
        window.localStorage.setItem("forcedThinkingExtraMs", String(safeValue))
      } else {
        window.localStorage.removeItem("forcedThinkingExtraMs")
      }
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const submit = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    const preferences = normalizePreferences({
      building: homeBuilding || undefined,
      preferredDiningHall: preferredDiningHall || undefined,
      dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    })

    baxterLastToolNameRef.current = null
    baxterShouldShowAfterResponseRef.current = baxterEnabled

    sendMessage(
      { parts: [{ type: "text", text }] },
      {
        body: { preferences },
      }
    )
    setInput("")
  }

  return (
    <div className="mobile-content-safe flex h-svh w-full overflow-hidden md:pb-0">
      {isTestModeEnabled && (
        <TestMode
          forcedThinkingExtraMs={forcedThinkingExtraMs}
          onForcedThinkingExtraMsChange={handleForcedThinkingExtraMsChange}
        />
      )}

      <AnimatePresence>
        {baxterOverlays.map((overlay) => (
          <BaxterOverlay
            key={overlay.id}
            position={overlay.position}
            src={overlay.src}
            onDismiss={() => {
              setBaxterOverlays((current) => current.filter((item) => item.id !== overlay.id))
            }}
          />
        ))}
      </AnimatePresence>

      {/* Left stat panel */}
      <AnimatePresence>
        {statEntries.length > 0 && (
          <motion.aside
            key="stat-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 304, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="hidden h-full shrink-0 overflow-hidden border-r border-border bg-background/80 backdrop-blur-sm md:block"
            style={{ minWidth: 0 }}
          >
            <div className="w-[304px] h-full">
              <StatPanel entries={statEntries} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Right: chat column */}
      <div className="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden">
        <div
          className="flex w-full items-center justify-end gap-1 px-4 md:hidden"
          style={{ paddingTop: "max(env(safe-area-inset-top), 0.5rem)" }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="New chat"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <SettingsPopover
            baxterEnabled={baxterEnabled}
            onBaxterChange={handleBaxterChange}
            expandedToolCallsEnabled={expandedToolCallsEnabled}
            onExpandedToolCallsChange={handleExpandedToolCallsChange}
            homeBuilding={homeBuilding}
            onHomeBuildingChange={handleHomeBuildingChange}
            preferredDiningHall={preferredDiningHall}
            onPreferredDiningHallChange={handlePreferredDiningHallChange}
            dietaryPreferences={dietaryPreferences}
            onDietaryPreferencesChange={handleDietaryPreferencesChange}
            displayName={displayName}
            onDisplayNameChange={handleDisplayNameChange}
          />
        </div>

        {/* Floating settings button (desktop only) */}
        <div className="pointer-events-none absolute right-4 top-2 z-20 hidden md:block">
          <div className="pointer-events-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="New chat"
              onClick={() => window.location.reload()}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
              <Link href="/dashboard" aria-label="Open dashboard">
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </Button>
            <SettingsPopover
              baxterEnabled={baxterEnabled}
              onBaxterChange={handleBaxterChange}
              expandedToolCallsEnabled={expandedToolCallsEnabled}
              onExpandedToolCallsChange={handleExpandedToolCallsChange}
              homeBuilding={homeBuilding}
              onHomeBuildingChange={handleHomeBuildingChange}
              preferredDiningHall={preferredDiningHall}
              onPreferredDiningHallChange={handlePreferredDiningHallChange}
              dietaryPreferences={dietaryPreferences}
              onDietaryPreferencesChange={handleDietaryPreferencesChange}
              displayName={displayName}
              onDisplayNameChange={handleDisplayNameChange}
            />
          </div>
        </div>

        <div className="flex w-full max-w-screen-md flex-1 flex-col overflow-hidden">

        {/* Empty state */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-1 flex-col justify-center px-4 pt-4 md:px-8 md:pt-0"
            >
              <div className="mb-8 md:mb-10">
                <motion.h1
                  className="text-2xl font-semibold sm:text-3xl"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {heroGreeting}
                </motion.h1>
                <motion.p
                  className="mt-1 text-lg text-muted-foreground sm:text-xl"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.06 }}
                >
                  {heroSubline}
                </motion.p>
                <motion.p
                  className="mt-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE, delay: 0.12 }}
                >
                  {weatherPillLabel}
                </motion.p>
              </div>
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SCENARIOS.map((s, i) => (
                  <motion.div
                    key={s.title}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <ScenarioCard
                      scenario={s}
                      setInput={setInput}
                      inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat thread */}
        {messages.length > 0 && (
          <div className="flex flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto px-4 pb-6 pt-3 md:px-8 md:pb-4 md:pt-8">
            {messages.map((msg) => {
              const seenToolsForMessage = new Set<string>()

              return (
                <motion.div
                  key={msg.id}
                  variants={msg.role === "user" ? userMessageVariants : assistantMessageVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[88%] sm:max-w-[82%] ${msg.role === "user"
                    ? "rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-primary-foreground"
                    : "break-words text-sm leading-relaxed"
                    }`}>
                    {msg.role === "user" ? (
                      msg.parts?.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("") ?? ""
                    ) : (
                      <div className="space-y-1">
                        {msg.parts?.map((part, pi) => {
                          if (part.type === "text" && part.text.length > 0) {
                            return (
                              <div key={pi} className="rounded-2xl rounded-bl-sm bg-muted text-foreground px-4 py-2.5">
                                <MarkdownMessage content={part.text} />
                              </div>
                            )
                          }
                          if (part.type.startsWith("tool-") || part.type === "tool-invocation" || part.type === "dynamic-tool") {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const p = part as any
                            const ti = p.toolInvocation || {}
                            // Fallback across different AI SDK versions
                            const toolCallId = p.toolCallId || ti.toolCallId || `tc-${pi}`
                            const toolName = p.toolName || ti.toolName || p.name || "unknown-tool"
                            const stateRaw = p.state || ti.state || (p.type === "tool-result" ? "result" : "call")

                            let result = p.output || p.result || ti.result

                            // Handle Vercel AI SDK wrapping MCP tool responses in { content: [{ type: "text", text: "..." }] }
                            if (result && typeof result === "object" && Array.isArray(result.content) && result.content.length > 0) {
                              const text = result.content[0].text
                              if (typeof text === "string") {
                                try {
                                  result = JSON.parse(text)
                                } catch {
                                  result = { text }
                                }
                              }
                            }

                            // If output-available, it's a finished result (Vercel AI SDK dynamic-tool pattern)
                            const actualState = (stateRaw === "result" || stateRaw === "output-available" || result !== undefined) ? "result" : "call"

                            const isFirstOfType = !seenToolsForMessage.has(toolName)
                            if (isFirstOfType) {
                              seenToolsForMessage.add(toolName)
                            }

                            return (
                              <ToolCallCard
                                key={toolCallId}
                                toolName={toolName}
                                state={actualState}
                                result={result}
                                isVisualUnique={isFirstOfType}
                                forcedThinkingExtraMs={forcedThinkingExtraMs}
                                collapseOnComplete={!expandedToolCallsEnabled}
                              />
                            )
                          }
                          return null
                        })}
                        {(!msg.parts || msg.parts.length === 0) && (
                          <div className="rounded-2xl rounded-bl-sm bg-muted text-foreground px-4 py-2.5">
                            &nbsp;
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-muted mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              )
            })}

            {/* Thinking animation */}
            <AnimatePresence>
              {status === "submitted" && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, y: 16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-2 w-2 rounded-full bg-muted-foreground"
                        animate={{ scale: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
                        transition={{
                          duration: 1.1,
                          repeat: Infinity,
                          delay: i * 0.18,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex gap-3 justify-start"
              >
                <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive sm:max-w-[82%]">
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-destructive/80 font-mono text-xs break-all">{error.message}</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-0 shrink-0" />
          </div>
        )}

        {/* Input */}
        <div className="w-full flex-shrink-0 px-4 pb-3 pt-2 md:px-8 md:pb-4">
          <div className="relative flex w-full flex-col rounded-3xl bg-muted/50 focus-within:ring-1 focus-within:ring-ring transition-shadow">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                if (voiceError) {
                  resetVoiceError()
                }
                setInput(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder="Send a message..."
              className="min-h-16 w-full resize-none bg-transparent dark:bg-transparent px-4 pt-4 pb-0 border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none text-sm md:text-base"
              rows={1}
            />
            <div className="flex items-center justify-between p-2">
              <div className="flex min-w-0 items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-transparent">
                  <Paperclip className="h-4 w-4" />
                  <span className="sr-only">Attach file</span>
                </Button>
                {voiceStatusText && (
                  <p className={`truncate text-xs ${voiceState === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                    {voiceStatusText}
                  </p>
                )}
              </div>
              <div className="mr-1 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={micButtonTitle}
                  aria-label={micButtonTitle}
                  aria-pressed={isVoiceActive}
                  disabled={!isVoiceSupported || isStreaming}
                  onClick={toggleVoiceInput}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground disabled:opacity-40"
                >
                  {isVoiceSupported ? (
                    <Mic className={`h-4 w-4 ${isVoiceActive ? "text-destructive" : ""}`} />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                  <span className="sr-only">{micButtonTitle}</span>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  disabled={!input.trim() || isStreaming}
                  onClick={submit}
                  className="h-8 w-8 rounded-full transition-opacity disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>

      </div>{/* end chat column */}

      <MobileBottomTabs activeRoute="chat" />
    </div>
  )
}
