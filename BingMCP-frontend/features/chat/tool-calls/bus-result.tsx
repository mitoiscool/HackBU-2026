import { motion } from "framer-motion"
import { Bus, MapPin } from "lucide-react"
import { FallbackResult } from "./fallback-result"

export function BusResult({ data }: { data: Record<string, unknown> }) {
    const routes = (data.routes as Array<Record<string, unknown>>) ?? []
    if (routes.length === 0) return <FallbackResult data={data} />

    return (
        <div className="space-y-2">
            {routes.map((route, i) => (
                <motion.div
                    key={`${route.name}-${i}`}
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
