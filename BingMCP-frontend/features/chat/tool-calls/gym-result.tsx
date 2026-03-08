import { motion } from "framer-motion"
import { Circle, Clock, Dumbbell } from "lucide-react"

export function GymResult({ data }: { data: Record<string, unknown> }) {
    const percent = Number(data.capacity_percent ?? 0)
    const isOpen = data.is_open as boolean | undefined
    const hours = String(data.hours ?? "")

    // Color based on capacity
    const barColor =
        percent < 40
            ? "bg-primary"
            : percent < 70
                ? "bg-chart-1"
                : "bg-destructive"

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg bg-background/60 border border-border px-3.5 py-3"
        >
            <div className="flex items-center gap-2.5 mb-2.5">
                <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground flex-1">
                    East Gym
                </span>
                <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isOpen
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                        }`}
                >
                    <Circle className="h-1.5 w-1.5 fill-current" />
                    {isOpen ? "Open" : "Closed"}
                </span>
            </div>
            {/* Capacity bar */}
            <div className="mb-2">
                <div className="flex items-end justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Capacity</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                        {percent}%
                    </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                    />
                </div>
            </div>
            {hours && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    <span>{hours}</span>
                </div>
            )}
        </motion.div>
    )
}
