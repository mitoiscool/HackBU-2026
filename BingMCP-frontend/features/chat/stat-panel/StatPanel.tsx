"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
    Bus, Dumbbell, WashingMachine, UtensilsCrossed, BookOpen,
    Circle, MapPin, Clock, Activity, BookMarked,
} from "lucide-react"

export interface StatEntry {
    id: string
    toolName: string
    result: Record<string, unknown>
    timestamp: number
}

// ─── Bus ─────────────────────────────────────────────────────────────────────

function BigBusCard({ data }: { data: Record<string, unknown> }) {
    const routes = (data.routes as Array<Record<string, unknown>>) ?? []
    if (routes.length === 0) {
        return <p className="text-xs text-muted-foreground text-center py-4">No active routes found</p>
    }

    return (
        <div className="space-y-2.5">
            {routes.map((route, i) => {
                const mins = Number(route.next_arrival_minutes ?? 99)
                const isClose = mins <= 3
                const isMid = mins > 3 && mins <= 8
                const colorClass = isClose ? "text-emerald-400" : isMid ? "text-amber-400" : "text-muted-foreground"
                const bgClass = isClose
                    ? "bg-emerald-400/8 border-emerald-400/20"
                    : isMid
                        ? "bg-amber-400/8 border-amber-400/20"
                        : "bg-muted/40 border-border"

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.09, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${bgClass}`}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{String(route.name)}</p>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{String(route.current_stop)}</span>
                            </div>
                        </div>
                        <div className={`text-right shrink-0 ${colorClass}`}>
                            <span className="text-2xl font-bold tabular-nums leading-none">{mins}</span>
                            <span className="text-[11px] ml-0.5 opacity-70">min</span>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

// ─── Gym ─────────────────────────────────────────────────────────────────────

function BigGymCard({ data }: { data: Record<string, unknown> }) {
    const percent = Number(data.capacity_percent ?? 0)
    const isOpen = data.is_open as boolean | undefined
    const hours = String(data.hours ?? "")
    const r = 38
    const circumference = 2 * Math.PI * r
    const strokeColor = percent < 40 ? "#22c55e" : percent < 70 ? "#f59e0b" : "#ef4444"

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-muted/25" />
                    <motion.circle
                        cx="50" cy="50" r={r}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={String(circumference)}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
                        transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        className="text-2xl font-bold tabular-nums leading-none"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.45, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {percent}%
                    </motion.span>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">capacity</span>
                </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isOpen ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                <Circle className="h-2 w-2 fill-current" />
                {isOpen ? "Open" : "Closed"}
            </div>
            {hours && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{hours}</span>
                </div>
            )}
        </div>
    )
}

// ─── Laundry ─────────────────────────────────────────────────────────────────

function MachineGrid({ label, available, total }: { label: string; available: number; total: number }) {
    const pct = total > 0 ? Math.round((available / total) * 100) : 0
    const cols = Math.min(total, 5)

    return (
        <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-xs font-bold text-foreground tabular-nums">{available}/{total}</span>
            </div>
            <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: total }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 500, damping: 22 }}
                        className={`aspect-square rounded-md border ${i < available ? "bg-primary/25 border-primary/40" : "bg-muted/40 border-border"}`}
                    />
                ))}
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${pct > 50 ? "bg-primary" : pct > 0 ? "bg-amber-400" : "bg-destructive"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                />
            </div>
        </div>
    )
}

function BigLaundryCard({ data }: { data: Record<string, unknown> }) {
    const washers = data.washers as { available: number; total: number } | undefined
    const dryers = data.dryers as { available: number; total: number } | undefined

    return (
        <div className="flex gap-5">
            {washers && <MachineGrid label="Washers" available={washers.available} total={washers.total} />}
            {dryers && <MachineGrid label="Dryers" available={dryers.available} total={dryers.total} />}
        </div>
    )
}

// ─── Dining Status ────────────────────────────────────────────────────────────

function BigDiningStatusCard({ data }: { data: Record<string, unknown> }) {
    const isOpen = data.is_open as boolean | undefined
    const hours = String(data.hours ?? "")

    return (
        <div className="space-y-3">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-center justify-center gap-2.5 rounded-2xl py-7 ${isOpen ? "bg-primary/10" : "bg-destructive/10"}`}
            >
                <Circle className={`h-3.5 w-3.5 fill-current ${isOpen ? "text-primary" : "text-destructive"}`} />
                <span className={`text-2xl font-bold ${isOpen ? "text-primary" : "text-destructive"}`}>
                    {isOpen ? "Open Now" : "Closed"}
                </span>
            </motion.div>
            {hours && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3.5 py-2.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{hours}</span>
                </div>
            )}
        </div>
    )
}

// ─── Dining Menu ─────────────────────────────────────────────────────────────

function BigDiningMenuCard({ data }: { data: Record<string, unknown> }) {
    const summary = data.summary as Record<string, number> | undefined
    const meals = (data.meals as Array<Record<string, unknown>>) ?? []

    return (
        <div className="space-y-2.5">
            {summary && (
                <div className="flex gap-3 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3.5 py-2.5">
                    <span><span className="font-bold text-foreground">{summary.meal_count}</span> meals</span>
                    <span><span className="font-bold text-foreground">{summary.station_count}</span> stations</span>
                    <span><span className="font-bold text-foreground">{summary.item_count}</span> items</span>
                </div>
            )}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-0.5">
                {meals.map((meal, mi) => {
                    const stations = (meal.stations as Array<Record<string, unknown>>) ?? []
                    return (
                        <motion.div
                            key={mi}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: mi * 0.08 }}
                            className="rounded-xl bg-muted/40 border border-border px-3.5 py-2.5"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">
                                {String(meal.meal_name)}
                            </p>
                            <div className="space-y-1">
                                {stations.slice(0, 3).map((station, si) => {
                                    const items = (station.items as Array<Record<string, unknown>>) ?? []
                                    return (
                                        <div key={si}>
                                            <p className="text-[10px] font-semibold text-muted-foreground">{String(station.station_name)}</p>
                                            {items.slice(0, 2).map((item, ii) => (
                                                <p key={ii} className="text-[11px] text-foreground/70 pl-2 truncate">{String(item.name)}</p>
                                            ))}
                                            {items.length > 2 && (
                                                <p className="text-[10px] text-muted-foreground/60 pl-2">+{items.length - 2} more</p>
                                            )}
                                        </div>
                                    )
                                })}
                                {stations.length > 3 && (
                                    <p className="text-[10px] text-muted-foreground/60">+{stations.length - 3} more stations</p>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Library ─────────────────────────────────────────────────────────────────

function BigLibraryCard({ data }: { data: Record<string, unknown> }) {
    const rooms = (
        (data.rooms as Array<Record<string, unknown>>) ??
        (data.available_rooms as Array<Record<string, unknown>>) ??
        []
    )

    if (rooms.length === 0) {
        return (
            <div className="text-center py-4">
                <BookMarked className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No rooms found</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {rooms.slice(0, 6).map((room, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border px-3 py-2"
                >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${room.available ? "bg-primary" : "bg-destructive"}`} />
                    <span className="text-xs font-medium text-foreground flex-1 truncate">
                        {String(room.name ?? room.room_name ?? `Room ${i + 1}`)}
                    </span>
                    {Boolean(room.available) && (
                        <span className="text-[10px] text-primary font-semibold">Available</span>
                    )}
                </motion.div>
            ))}
        </div>
    )
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function BigFallbackCard({ data }: { data: Record<string, unknown> }) {
    return (
        <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto">
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}

// ─── Card Metadata ─────────────────────────────────────────────────────────────

function getCardMeta(toolName: string, result?: Record<string, unknown>): { icon: React.ReactNode; label: string } {
    switch (toolName) {
        case "get_bus_locations":
            return { icon: <Bus className="h-4 w-4" />, label: "Bus Routes" }
        case "get_gym_capacity":
            return { icon: <Dumbbell className="h-4 w-4" />, label: "East Gym" }
        case "get_laundry_availability":
            return { icon: <WashingMachine className="h-4 w-4" />, label: "Laundry" }
        case "get_dining_status": {
            const hallName = result?.hall ? String(result.hall) : "Dining Hall"
            return { icon: <UtensilsCrossed className="h-4 w-4" />, label: hallName }
        }
        case "get_dining_menu": {
            const hallName = result?.hall ? String(result.hall) : "Dining Menu"
            return { icon: <UtensilsCrossed className="h-4 w-4" />, label: hallName }
        }
        case "get_available_library_rooms":
            return { icon: <BookOpen className="h-4 w-4" />, label: "Study Rooms" }
        default:
            return { icon: <Activity className="h-4 w-4" />, label: "Result" }
    }
}

// ─── Big Stat Card ─────────────────────────────────────────────────────────────

function BigStatCard({ entry }: { entry: StatEntry }) {
    const { toolName, result, timestamp } = entry
    const meta = getCardMeta(toolName, result)

    const elapsed = Math.round((Date.now() - timestamp) / 1000)
    const timeLabel = elapsed < 5 ? "just now" : elapsed < 60 ? `${elapsed}s ago` : `${Math.round(elapsed / 60)}m ago`

    function renderContent() {
        switch (toolName) {
            case "get_bus_locations": return <BigBusCard data={result} />
            case "get_gym_capacity": return <BigGymCard data={result} />
            case "get_laundry_availability": return <BigLaundryCard data={result} />
            case "get_dining_status": return <BigDiningStatusCard data={result} />
            case "get_dining_menu": return <BigDiningMenuCard data={result} />
            case "get_available_library_rooms": return <BigLibraryCard data={result} />
            default: return <BigFallbackCard data={result} />
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
        >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-muted/20">
                <span className="text-primary">{meta.icon}</span>
                <span className="flex-1 text-sm font-semibold text-foreground">{meta.label}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{timeLabel}</span>
            </div>
            <div className="px-4 py-4">
                {renderContent()}
            </div>
        </motion.div>
    )
}

// ─── Stat Panel ─────────────────────────────────────────────────────────────────

export function StatPanel({ entries }: { entries: StatEntry[] }) {
    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-border/60 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Stats</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <AnimatePresence mode="popLayout">
                    {entries.map((entry) => (
                        <BigStatCard key={entry.id} entry={entry} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
