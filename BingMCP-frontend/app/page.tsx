"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { Timer, Bus, MoonStar, Wallet, Paperclip, ArrowUp, User, Bot, Settings2 } from "lucide-react"
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

const SCENARIOS: Scenario[] = [
  {
    icon: <Timer className="h-4 w-4" />,
    title: "Optimize My Gap",
    prompt: "I have 90 minutes before class at Bartle. Are there open washers in Digman, and is the East Gym empty enough for a quick workout? Which bus is fastest?",
    badges: ["Laundry API", "BingGym", "OCCT Transit"],
  },
  {
    icon: <Bus className="h-4 w-4" />,
    title: "The Commuter Pivot",
    prompt: "I'm on the Route 14 outbound. Based on the current bus location and East Gym capacity, should I go lift right now or just head straight to my dorm?",
    badges: ["OCCT Transit", "BingGym"],
  },
  {
    icon: <MoonStar className="h-4 w-4" />,
    title: "Late Night Grind",
    prompt: "It's 10:30 PM. Find me an empty study room in the UDC. Also, is there any dining hall or late-night food still open on campus?",
    badges: ["LibCal API", "Sodexo API"],
  },
  {
    icon: <Wallet className="h-4 w-4" />,
    title: "Transit vs. Wallet",
    prompt: "The outbound bus is heavily delayed. Check my daily entertainment budget and tell me if I can afford to just split an Uber downtown with two friends instead.",
    badges: ["OCCT Transit", "Visions Mock API"],
  },
]

// Easing curve for premium snappy feel
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE, delay: i * 0.07 },
  }),
}

const messageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
}

type SettingsPopoverProps = {
  baxterEnabled: boolean
  onBaxterChange: (enabled: boolean) => void
  displayName: string
  onDisplayNameChange: (name: string) => void
}

function SettingsPopover({
  baxterEnabled,
  onBaxterChange,
  displayName,
  onDisplayNameChange,
}: SettingsPopoverProps) {
  const { theme, setTheme } = useTheme()
  const activeTheme = theme === "light" ? "light" : "dark"

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
      <DropdownMenuContent align="end" className="w-72 p-3">
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
  const [baxterEnabled, setBaxterEnabled] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const heroName = displayName.trim()

  const isStreaming = status === "streaming" || status === "submitted"

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

    Promise.resolve().then(() => {
      if (!active) return

      try {
        const storedBaxter = window.localStorage.getItem("baxter")
        if (storedBaxter === "true" || storedBaxter === "false") {
          setBaxterEnabled(storedBaxter === "true")
        }

        const storedName = window.localStorage.getItem("name")
        if (typeof storedName === "string") {
          setDisplayName(storedName.trim())
        }
      } catch {
        // Ignore localStorage access errors.
      }
    })

    return () => {
      active = false
    }
  }, [])

  const handleBaxterChange = (enabled: boolean) => {
    setBaxterEnabled(enabled)
    try {
      window.localStorage.setItem("baxter", String(enabled))
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

  const submit = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    sendMessage({ parts: [{ type: "text", text }] })
    setInput("")
  }

  return (
    <div className="flex flex-col h-svh items-center">
      {isTestModeEnabled && <TestMode />}

      {/* Top bar */}
      <div className="w-full flex justify-end px-4 py-2 shrink-0">
        <SettingsPopover
          baxterEnabled={baxterEnabled}
          onBaxterChange={handleBaxterChange}
          displayName={displayName}
          onDisplayNameChange={handleDisplayNameChange}
        />
      </div>

      <div className="flex flex-1 w-full max-w-screen-md flex-col overflow-hidden">

        {/* Empty state */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-1 flex-col justify-center px-4 md:px-8"
            >
              <div className="mb-10">
                <motion.h1
                  className="text-3xl font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {heroName ? `Hello there, ${heroName}!` : "Hello there!"}
                </motion.h1>
                <motion.p
                  className="text-xl text-muted-foreground mt-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: 0.06 }}
                >
                  What do you want to tackle on campus?
                </motion.p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
          <div className="flex flex-1 flex-col gap-6 px-4 md:px-8 pt-8 pb-4 overflow-y-auto">
            {messages.map((msg) => {
              const seenToolsForMessage = new Set<string>()

              return (
                <motion.div
                  key={msg.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user"
                    ? "rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap"
                    : "text-sm leading-relaxed"
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
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
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive space-y-1">
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-destructive/80 font-mono text-xs break-all">{error.message}</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-0 shrink-0" />
          </div>
        )}

        {/* Input */}
        <div className="w-full flex-shrink-0 px-4 md:px-8 pb-4 pt-2">
          <div className="relative flex w-full flex-col rounded-3xl bg-muted/50 focus-within:ring-1 focus-within:ring-ring transition-shadow">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-transparent">
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
              </Button>
              <Button
                type="button"
                size="icon"
                disabled={!input.trim() || isStreaming}
                onClick={submit}
                className="h-8 w-8 mr-1 rounded-full transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
