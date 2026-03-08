"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface EventsVisualProps {
    className?: string
}

// Positions of cells (col, row) that have "events" marked on them
const EVENT_CELLS = new Set([2, 6, 9, 13, 16, 20, 24, 27, 30])

const COLS = 7
const ROWS = 5
const TOTAL = COLS * ROWS

export function EventsVisual({ className }: EventsVisualProps) {
    const { theme } = useTheme()
    const isLight = theme === "light"

    const bgColor = isLight ? "#f8fafc" : "#000000"
    const borderColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"
    const cellBg = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"
    const cellBorder = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)"
    const eventColor = "#10b981"
    const sweepColor = isLight ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.1)"

    return (
        <div
            className={cn(
                "relative w-full max-w-sm aspect-[16/9] rounded-2xl overflow-hidden shadow-sm transition-colors duration-300",
                className,
            )}
            style={{ background: bgColor, border: `1px solid ${borderColor}` }}
        >
            {/* Column sweep bar — slides left to right, looping */}
            <motion.div
                className="absolute top-0 bottom-0 w-8 pointer-events-none z-10"
                style={{ background: `linear-gradient(90deg, transparent, ${sweepColor}, transparent)` }}
                animate={{ left: ["-10%", "110%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Calendar grid */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="grid gap-[5px]"
                    style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, padding: "14% 10%" }}
                >
                    {Array.from({ length: TOTAL }).map((_, i) => {
                        const hasEvent = EVENT_CELLS.has(i)
                        const row = Math.floor(i / COLS)
                        const col = i % COLS
                        // stagger delay cascades column-by-column, then row
                        const delay = col * 0.045 + row * 0.02

                        return (
                            <motion.div
                                key={i}
                                className="aspect-square rounded-[4px] relative flex items-center justify-center"
                                style={{ background: cellBg, border: `1px solid ${cellBorder}` }}
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {hasEvent && (
                                    <motion.div
                                        className="absolute inset-0 rounded-[4px]"
                                        style={{ background: `${eventColor}18`, border: `1px solid ${eventColor}50` }}
                                        animate={{ opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }}
                                    />
                                )}
                                {hasEvent && (
                                    <motion.div
                                        className="w-1.5 h-1.5 rounded-full z-10"
                                        style={{ background: eventColor, boxShadow: isLight ? "none" : `0 0 6px ${eventColor}` }}
                                        animate={{ scale: [0.8, 1.2, 0.8] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }}
                                    />
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Scanline overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-10"
                style={{
                    backgroundImage: `linear-gradient(${isLight ? "rgba(0,0,0,0.4)" : "rgba(16,185,129,0.4)"} 1px, transparent 1px)`,
                    backgroundSize: "100% 4px",
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none z-30 transition-shadow duration-300"
                style={{ boxShadow: isLight ? "inset 0 0 40px rgba(0,0,0,0.06)" : "inset 0 0 60px rgba(0,0,0,0.9)" }}
            />
        </div>
    )
}

export default EventsVisual
