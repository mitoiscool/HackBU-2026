import { motion } from "framer-motion"
import { Bus, Dumbbell, WashingMachine, UtensilsCrossed, Circle, Loader2 } from "lucide-react"

export function ToolLoadingRenderer({ toolName }: { toolName: string }) {
    switch (toolName) {
        case "get_bus_locations":
            return (
                <div className="flex items-center gap-3 rounded-lg bg-background/40 border border-border/50 px-3 py-2.5">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0">
                        <motion.div
                            animate={{ x: [-2, 4, -2] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Bus className="h-4 w-4 text-primary" />
                        </motion.div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-2 w-32 bg-muted/60 animate-pulse rounded" />
                    </div>
                </div>
            )
        case "get_gym_capacity":
            return (
                <div className="rounded-lg bg-background/40 border border-border/50 px-3.5 py-3">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <motion.div
                            animate={{ scale: [0.9, 1.1, 0.9], rotate: [-5, 5, -5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                        </motion.div>
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full w-1/3 bg-primary/30 rounded-full"
                            animate={{ x: ["-100%", "300%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                </div>
            )
        case "get_laundry_availability":
            return (
                <div className="rounded-lg bg-background/40 border border-border/50 px-3.5 py-3">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                            <WashingMachine className="h-4 w-4 text-primary shrink-0" />
                        </motion.div>
                        <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1.5">
                            <div className="h-2 w-12 bg-muted animate-pulse rounded" />
                            <div className="h-2 w-full bg-muted/50 rounded-full" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="h-2 w-12 bg-muted animate-pulse rounded" />
                            <div className="h-2 w-full bg-muted/50 rounded-full" />
                        </div>
                    </div>
                </div>
            )
        case "get_dining_status":
        case "get_dining_menu":
            return (
                <div className="rounded-lg bg-background/40 border border-border/50 px-3.5 py-3">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <motion.div
                            animate={{ y: [-1, 1, -1] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <UtensilsCrossed className="h-4 w-4 text-primary shrink-0" />
                        </motion.div>
                        <div className="flex-1">
                            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-3 w-10 bg-muted animate-pulse rounded-full" />
                    </div>
                    <div className="h-2 w-24 bg-muted/50 animate-pulse rounded mt-2" />
                </div>
            )
        case "get_available_library_rooms":
            return (
                <div className="rounded-lg bg-background/40 border border-border/50 px-3.5 py-3">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <motion.div
                            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Circle className="h-4 w-4 text-primary shrink-0" />
                        </motion.div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                            <div className="h-2 w-24 bg-muted/60 animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            )
        default:
            return (
                <div className="flex items-center gap-3 rounded-lg bg-background/40 border border-border/50 px-3 py-2.5">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
            )
    }
}
