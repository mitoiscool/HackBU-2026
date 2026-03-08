"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FallbackVisualProps {
    className?: string
}

export function FallbackVisual({ className }: FallbackVisualProps) {
    return (
        <div
            className={cn(
                "relative w-full max-w-sm aspect-[16/9] rounded-2xl border border-tool-call-border/70 bg-black overflow-hidden shadow-sm flex items-center justify-center",
                className,
            )}
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="absolute w-16 h-16 rounded-full border border-[#d946ef] opacity-50 shadow-[0_0_15px_#d946ef]"
                    animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute w-24 h-24 rounded-full border border-[#22d3ee] border-dashed opacity-30 origin-center"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute w-8 h-8 rounded-full bg-[#6366f1] blur-md opacity-60"
                    animate={{ opacity: [0.6, 1, 0.6], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Screen Effects / Hologram Overlays */}
            <div
                className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-10"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(217, 70, 239, 0.5) 1px, transparent 1px)",
                    backgroundSize: "100% 4px",
                }}
            />
            <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]" />
        </div>
    )
}

export default FallbackVisual
