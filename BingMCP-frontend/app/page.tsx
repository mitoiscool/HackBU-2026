"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { motion } from "framer-motion"
import { Timer, Bus, MoonStar, Wallet, Paperclip, ArrowUp, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScenarioCard, type Scenario } from "@/components/ui/scenario-card"
import { MarkdownMessage } from "@/components/ui/markdown-message"
import { ToolCallCard } from "@/components/ui/tool-call-card"

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

export default function ChatWindow() {
  const { messages, status, sendMessage } = useChat()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isStreaming = status === "streaming" || status === "submitted"

  // Auto-scroll to bottom when messages change or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  const submit = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    sendMessage({ parts: [{ type: "text", text }] })
    setInput("")
  }

  return (
    <div className="flex flex-col h-svh items-center">
      <div className="flex flex-1 w-full max-w-screen-md flex-col overflow-hidden">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col justify-center px-4 md:px-8">
            <div className="mb-10">
              <h1 className="text-3xl font-semibold">Hello there!</h1>
              <p className="text-xl text-muted-foreground mt-1">What do you want to tackle on campus?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SCENARIOS.map((s) => (
                <ScenarioCard
                  key={s.title}
                  scenario={s}
                  setInput={setInput}
                  inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chat thread */}
        {messages.length > 0 && (
          <div className="flex flex-1 flex-col gap-6 px-4 md:px-8 pt-8 pb-4 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                        if (part.type.startsWith("tool-")) {
                          const tp = part as { type: string; toolCallId: string; toolName: string; state: string; input?: Record<string, unknown>; output?: unknown }
                          return (
                            <ToolCallCard
                              key={tp.toolCallId}
                              toolName={tp.toolName}
                              state={tp.state === "result" ? "result" : "call"}
                              args={(tp.input as Record<string, unknown>) ?? {}}
                              result={tp.output}
                            />
                          )
                        }
                        return null
                      })}
                      {/* If there are no parts yet, show empty bubble */}
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
              </div>
            ))}

            {/* Thinking animation — shown while waiting for first token */}
            {status === "submitted" && (
              <div className="flex gap-3 justify-start">
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
              </div>
            )}

            {/* Scroll anchor */}
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
