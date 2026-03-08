"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Loader2, CheckCircle2 } from "lucide-react"

import { getToolMeta } from "./meta"
import { ToolResultRenderer } from "./tool-result-renderer"
import { ToolLoadingRenderer } from "./tool-loading-renderer"
import { ToolCallCardProps } from "./types"

export function ToolCallCard({
    toolName,
    state,
    result,
    isVisualUnique = true,
    forcedThinkingExtraMs = 0,
    collapseOnComplete = false,
}: ToolCallCardProps) {
    const [expanded, setExpanded] = useState(true)
    const [showResult, setShowResult] = useState(false)
    const [startTime] = useState(() => Date.now())
    const isComplete = state === "result"
    const meta = getToolMeta(toolName)

    useEffect(() => {
        if (isComplete) {
            const elapsed = Date.now() - startTime
            // Ensure the user sees the beautiful animation for at least 2.5s total, 
            // but add a guaranteed 1s minimum delay even if it took 5s, just letting it finish a cycle.
            const delay = Math.max(2500 - elapsed, 1200) + Math.max(0, forcedThinkingExtraMs)
            const timer = setTimeout(() => setShowResult(true), delay)
            return () => clearTimeout(timer)
        }
    }, [forcedThinkingExtraMs, isComplete, startTime])

    useEffect(() => {
        if (!isComplete || !collapseOnComplete) return

        let active = true
        Promise.resolve().then(() => {
            if (active) {
                setExpanded(false)
            }
        })

        return () => {
            active = false
        }
    }, [collapseOnComplete, isComplete])

    return (
        <motion.div
            initial={{ opacity: 0, x: -16, y: 4 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="my-1.5 rounded-xl border border-tool-call-border bg-tool-call-bg overflow-hidden"
        >
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-tool-call-border/30"
            >
                <span className="shrink-0 text-primary">{meta.icon}</span>
                <span className="flex-1 font-medium text-foreground text-xs">
                    {meta.label}
                </span>
                {showResult ? (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    </motion.span>
                ) : (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                )}
                <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-muted-foreground"
                >
                    <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <motion.div
                            layout
                            transition={{ layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
                            className="border-t border-tool-call-border px-3.5 py-2.5 space-y-2"
                        >
                            <AnimatePresence mode="wait">
                                {showResult && result != null ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <ToolResultRenderer
                                            toolName={toolName}
                                            result={result}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ToolLoadingRenderer toolName={toolName} isVisualUnique={isVisualUnique} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
