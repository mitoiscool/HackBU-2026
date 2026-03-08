import { motion } from "framer-motion"
import { CalendarDays, MapPin, AlertTriangle } from "lucide-react"
import { FallbackResult } from "./fallback-result"

export function EventsResult({ data }: { data: Record<string, unknown> }) {
    const events = (data.events as Array<Record<string, unknown>>) ?? []
    const totalEvents = Number(data.total_events ?? 0)
    const returnedCount = Number(data.returned_count ?? events.length)
    const hasMore = Boolean(data.has_more)
    const stale = Boolean(data.stale)

    if (events.length === 0) return <FallbackResult data={data} />

    return (
        <div className="space-y-2">
            {stale && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Showing cached data — refresh may be delayed
                </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-0.5">
                <CalendarDays className="h-3 w-3 shrink-0" />
                <span>
                    Showing <span className="font-semibold text-foreground">{returnedCount}</span> of{" "}
                    <span className="font-semibold text-foreground">{totalEvents}</span> events
                </span>
            </div>

            {events.slice(0, 4).map((event, i) => (
                <motion.div
                    key={String(event.event_id ?? i)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.25 }}
                    className="rounded-lg bg-background/60 border border-border px-3 py-2.5 space-y-1"
                >
                    <p className="text-xs font-semibold text-foreground leading-snug truncate">
                        {String(event.name ?? "Unnamed Event")}
                    </p>
                    <div className="flex items-start gap-3 flex-wrap">
                        {event.dates_text && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
                                <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{String(event.dates_text)}</span>
                            </div>
                        )}
                        {event.location && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{String(event.location)}</span>
                            </div>
                        )}
                    </div>
                    {event.category && (
                        <span className="inline-block text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {String(event.category)}
                        </span>
                    )}
                </motion.div>
            ))}

            {hasMore && (
                <p className="text-[10px] text-muted-foreground text-center py-1">
                    + {totalEvents - returnedCount} more events
                </p>
            )}
        </div>
    )
}
