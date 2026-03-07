"use client"

import type { RefObject } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const MotionButton = motion.create(Button)

export interface Scenario {
    icon: React.ReactNode
    title: string
    prompt: string
    badges: string[]
}

interface ScenarioCardProps {
    scenario: Scenario
    setInput: (value: string) => void
    inputRef: RefObject<HTMLTextAreaElement>
}

export function ScenarioCard({ scenario, setInput, inputRef }: ScenarioCardProps) {
    const handleClick = () => {
        setInput(scenario.prompt)
        inputRef.current?.focus()
    }

    return (
        <MotionButton
            variant="outline"
            onClick={handleClick}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="
        group h-auto flex flex-col justify-between items-start text-left w-full
        p-5 rounded-xl overflow-hidden
        whitespace-normal
        bg-scenario-card-bg border-border
        hover:bg-scenario-card-hover hover:border-ring hover:text-foreground
        transition-colors duration-150
      "
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <span className="shrink-0 text-primary">{scenario.icon}</span>
                <span className="font-semibold text-foreground leading-snug">
                    {scenario.title}
                </span>
            </div>

            {/* Prompt body */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 font-normal">
                &ldquo;{scenario.prompt}&rdquo;
            </p>

            {/* API Badges */}
            <div className="flex flex-wrap gap-2 mt-auto">
                {scenario.badges.map((badge) => (
                    <span
                        key={badge}
                        className="
              px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider
              text-scenario-badge-text bg-scenario-badge-bg border border-scenario-badge-border
              rounded-md
            "
                    >
                        {badge}
                    </span>
                ))}
            </div>
        </MotionButton>
    )
}
