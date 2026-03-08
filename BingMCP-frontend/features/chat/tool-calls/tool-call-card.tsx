"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Loader2, CheckCircle2 } from "lucide-react"

import { getToolMeta } from "./meta"
import { ToolResultRenderer } from "./tool-result-renderer"
import { ToolLoadingRenderer } from "./tool-loading-renderer"
import { ToolCallCardProps } from "./types"

export function ToolCallCard({ toolName, state, result }: ToolCallCardProps) {
    const [expanded, setExpanded] = useState(true)
    const isComplete = state === "result"
    const meta = getToolMeta(toolName)

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
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
                {isComplete ? (
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
                        <div className="border-t border-tool-call-border px-3.5 py-2.5 space-y-2">
                            {isComplete && result != null ? (
                                <ToolResultRenderer
                                    toolName={toolName}
                                    result={result}
                                />
                            ) : (
                                <ToolLoadingRenderer toolName={toolName} />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
