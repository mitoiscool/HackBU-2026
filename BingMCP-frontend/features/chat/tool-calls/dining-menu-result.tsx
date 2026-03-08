import { motion } from "framer-motion"
import { UtensilsCrossed } from "lucide-react"

export function DiningMenuResult({ data }: { data: Record<string, unknown> }) {
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
                                                (item.dietary_flags as Record<string, boolean>) ?? {}
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
                                                    {flags.vegetarian && !flags.vegan && (
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
