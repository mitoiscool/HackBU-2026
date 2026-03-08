import { motion } from "framer-motion"
import { Circle, Clock, UtensilsCrossed } from "lucide-react"

export function DiningStatusResult({ data }: { data: Record<string, unknown> }) {
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
