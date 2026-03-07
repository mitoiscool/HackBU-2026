"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronDown,
    Loader2,
    CheckCircle2,
    Bus,
    UtensilsCrossed,
    Dumbbell,
    WashingMachine,
    Clock,
    MapPin,
    Circle,
} from "lucide-react"

/* ── Tool display metadata ─────────────────────────────────────────────────── */

const TOOL_META: Record<
    string,
    { label: string; icon: React.ReactNode }
> = {
    get_bus_locations: {
        label: "Checking Bus Routes",
        icon: <Bus className="h-3.5 w-3.5" />,
    },
    get_dining_status: {
        label: "Checking Dining Hall",
        icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
    },
    get_dining_menu: {
        label: "Fetching Menu",
        icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
    },
    get_gym_capacity: {
        label: "Checking Gym Capacity",
        icon: <Dumbbell className="h-3.5 w-3.5" />,
    },
    get_laundry_availability: {
        label: "Checking Laundry Room",
        icon: <WashingMachine className="h-3.5 w-3.5" />,
    },
}

/* ── Per-tool result renderers ─────────────────────────────────────────────── */

function BusResult({ data }: { data: Record<string, unknown> }) {
    const routes = (data.routes as Array<Record<string, unknown>>) ?? []
    if (routes.length === 0) return <FallbackResult data={data} />

    return (
        <div className="space-y-2">
            {routes.map((route, i) => (
                <motion.div
                    key={String(route.name)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.25 }}
                    className="flex items-center gap-3 rounded-lg bg-background/60 border border-border px-3 py-2.5"
                >
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0">
                        <Bus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                            {String(route.name)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{String(route.current_stop)}</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-primary tabular-nums">
                            {String(route.next_arrival_minutes)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">min</span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

function DiningStatusResult({ data }: { data: Record<string, unknown> }) {
    const isOpen = data.is_open as boolean | undefined
    const hall = String(data.hall ?? "Dining Hall")
    const hours = String(data.hours ?? "")

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg bg-background/60 border border-border px-3.5 py-3"
        >
            <div className="flex items-center gap-2.5 mb-2">
                <UtensilsCrossed className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground flex-1">{hall}</span>
                <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isOpen
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        }`}
                >
                    <Circle className={`h-1.5 w-1.5 fill-current`} />
                    {isOpen ? "Open" : "Closed"}
                </span>
            </div>
            {hours && (
                <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-relaxed">
                    <Clock className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                    <span>{hours}</span>
                </div>
            )}
        </motion.div>
    )
}

function DiningMenuResult({ data }: { data: Record<string, unknown> }) {
    const hall = String(data.hall ?? "Dining Hall")
    const summary = data.summary as Record<string, number> | undefined
    const meals = (data.meals as Array<Record<string, unknown>>) ?? []

    return (
        <div className="space-y-2">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-background/60 border border-border px-3.5 py-2.5"
            >
                <div className="flex items-center gap-2 mb-1">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{hall}</span>
                </div>
                {summary && (
                    <div className="flex gap-4 text-[10px] text-muted-foreground">
                        <span>{summary.meal_count} meals</span>
                        <span>{summary.station_count} stations</span>
                        <span>{summary.item_count} items</span>
                    </div>
                )}
            </motion.div>
            {meals.map((meal, mi) => {
                const stations =
                    (meal.stations as Array<Record<string, unknown>>) ?? []
                return (
                    <motion.div
                        key={mi}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mi * 0.1, duration: 0.25 }}
                        className="rounded-lg bg-background/60 border border-border px-3.5 py-2.5"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">
                            {String(meal.meal_name)}
                        </p>
                        <div className="space-y-1.5">
                            {stations.map((station, si) => {
                                const items =
                                    (station.items as Array<
                                        Record<string, unknown>
                                    >) ?? []
                                return (
                                    <div key={si}>
                                        <p className="text-[10px] font-semibold text-foreground/70 mb-0.5">
                                            {String(station.station_name)}
                                        </p>
                                        {items.map((item, ii) => {
                                            const flags =
                                                (item.dietary_flags as Record<
                                                    string,
                                                    boolean
                                                >) ?? {}
                                            return (
                                                <div
                                                    key={ii}
                                                    className="flex items-center gap-2 text-[11px] text-muted-foreground py-0.5 pl-2"
                                                >
                                                    <span className="flex-1 truncate">
                                                        {String(item.name)}
                                                    </span>
                                                    {flags.vegan && (
                                                        <span className="text-[9px] font-bold text-primary px-1 py-px rounded bg-primary/10">
                                                            VG
                                                        </span>
                                                    )}
                                                    {flags.vegetarian &&
                                                        !flags.vegan && (
                                                            <span className="text-[9px] font-bold text-chart-2 px-1 py-px rounded bg-chart-2/10">
                                                                V
                                                            </span>
                                                        )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

function GymResult({ data }: { data: Record<string, unknown> }) {
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

function LaundryResult({ data }: { data: Record<string, unknown> }) {
    const building = String(data.building ?? "Building")
    const washers = data.washers as { available: number; total: number } | undefined
    const dryers = data.dryers as { available: number; total: number } | undefined

    const MachineGauge = ({
        label,
        available,
        total,
    }: {
        label: string
        available: number
        total: number
    }) => {
        const pct = total > 0 ? Math.round((available / total) * 100) : 0
        return (
            <div className="flex-1">
                <div className="flex items-end justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">
                        {available}/{total}
                    </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${pct > 50
                                ? "bg-primary"
                                : pct > 0
                                    ? "bg-chart-1"
                                    : "bg-destructive"
                            }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                    />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg bg-background/60 border border-border px-3.5 py-3"
        >
            <div className="flex items-center gap-2.5 mb-2.5">
                <WashingMachine className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                    {building} Laundry
                </span>
            </div>
            <div className="flex gap-4">
                {washers && (
                    <MachineGauge
                        label="Washers"
                        available={washers.available}
                        total={washers.total}
                    />
                )}
                {dryers && (
                    <MachineGauge
                        label="Dryers"
                        available={dryers.available}
                        total={dryers.total}
                    />
                )}
            </div>
        </motion.div>
    )
}

function FallbackResult({ data }: { data: Record<string, unknown> }) {
    return (
        <pre className="rounded-lg bg-background/60 border border-border px-3 py-2 text-xs font-mono text-foreground leading-relaxed overflow-x-auto">
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}

/* ── Tool Result Router ────────────────────────────────────────────────────── */

function ToolResultRenderer({
    toolName,
    result,
}: {
    toolName: string
    result: unknown
}) {
    const data = (result ?? {}) as Record<string, unknown>

    // If the result has a "status": "unavailable", show error state
    if (data.status === "unavailable") {
        return (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive">
                <span className="font-semibold">Unavailable</span>
                {data.reason && (
                    <span className="text-destructive/70 ml-1">— {String(data.reason)}</span>
                )}
            </div>
        )
    }

    switch (toolName) {
        case "get_bus_locations":
            return <BusResult data={data} />
        case "get_dining_status":
            return <DiningStatusResult data={data} />
        case "get_dining_menu":
            return <DiningMenuResult data={data} />
        case "get_gym_capacity":
            return <GymResult data={data} />
        case "get_laundry_availability":
            return <LaundryResult data={data} />
        default:
            return <FallbackResult data={data} />
    }
}

/* ── Main Tool Call Card ───────────────────────────────────────────────────── */

interface ToolCallCardProps {
    toolName: string
    state: "call" | "partial-call" | "result"
    args: Record<string, unknown>
    result?: unknown
}

export function ToolCallCard({ toolName, state, args, result }: ToolCallCardProps) {
    const [expanded, setExpanded] = useState(true)
    const isComplete = state === "result"
    const meta = TOOL_META[toolName] ?? {
        label: toolName,
        icon: <Clock className="h-3.5 w-3.5" />,
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="my-1.5 rounded-xl border border-tool-call-border bg-tool-call-bg overflow-hidden"
        >
            {/* Header */}
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

            {/* Expanded content */}
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
                            {/* Show rich result OR JSON args while loading */}
                            {isComplete && result != null ? (
                                <ToolResultRenderer
                                    toolName={toolName}
                                    result={result}
                                />
                            ) : (
                                Object.keys(args).length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                            Input
                                        </p>
                                        <pre className="rounded-lg bg-background/60 border border-border px-3 py-2 text-xs font-mono text-foreground leading-relaxed overflow-x-auto">
                                            {JSON.stringify(args, null, 2)}
                                        </pre>
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
