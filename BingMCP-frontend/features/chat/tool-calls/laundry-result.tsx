import { motion } from "framer-motion"
import { WashingMachine } from "lucide-react"
import { getBuildingStub } from "@/lib/preferences"

export function MachineGauge({
    label,
    available,
    total,
}: {
    label: string
    available: number
    total: number
}) {
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

export function LaundryResult({ data }: { data: Record<string, unknown> }) {
    const buildingToken = typeof data.building === "string" ? data.building : undefined
    const building = getBuildingStub(buildingToken) ?? "Laundry Room"
    const washers = data.washers as { available: number; total: number } | undefined
    const dryers = data.dryers as { available: number; total: number } | undefined

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
