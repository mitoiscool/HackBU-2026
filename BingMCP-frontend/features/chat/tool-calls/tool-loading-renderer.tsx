import { useEffect, useState, type ComponentType } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

type VisualModule = {
    default?: unknown
    [key: string]: unknown
}

interface ToolVisualMap {
    exportName: string
    load: () => Promise<VisualModule>
}

// Map the backend tool names to the visual components
const VISUAL_MAP: Record<string, ToolVisualMap> = {
    get_bus_locations: {
        exportName: "BusVisual",
        load: () => import("@/components/visuals/bus/BusVisual") as Promise<VisualModule>,
    },
    get_dining_status: {
        exportName: "DiningVisual",
        load: () => import("@/components/visuals/dining/DiningVisual") as Promise<VisualModule>,
    },
    get_dining_menu: {
        exportName: "DiningVisual",
        load: () => import("@/components/visuals/dining/DiningVisual") as Promise<VisualModule>,
    },
    get_gym_capacity: {
        exportName: "GymVisual",
        load: () => import("@/components/visuals/gym/GymVisual") as Promise<VisualModule>,
    },
    get_laundry_availability: {
        exportName: "LaundryVisual",
        load: () => import("@/components/visuals/laundry/LaundryVisual") as Promise<VisualModule>,
    },
    get_available_library_rooms: {
        exportName: "LibraryVisual",
        load: () => import("@/components/visuals/library/LibraryVisual") as Promise<VisualModule>,
    },
}

const FALLBACK_VISUAL: ToolVisualMap = {
    exportName: "FallbackVisual",
    load: () => import("@/components/visuals/shared/FallbackVisual") as Promise<VisualModule>,
}

function resolveComponent(module: VisualModule, exportName: string): ComponentType | null {
    const candidate = module[exportName] ?? module.default
    if (typeof candidate === "function") {
        return candidate as ComponentType
    }
    return null
}

export function ToolLoadingRenderer({ toolName, isVisualUnique = true }: { toolName: string; isVisualUnique?: boolean }) {
    const [resolvedVisual, setResolvedVisual] = useState<ComponentType | null>(null)

    const mapping = VISUAL_MAP[toolName] ?? FALLBACK_VISUAL

    useEffect(() => {
        let cancelled = false

        mapping
            .load()
            .then((module) => {
                if (cancelled) return
                setResolvedVisual(() => resolveComponent(module, mapping.exportName))
            })
            .catch(() => {
                if (cancelled) return
                setResolvedVisual(null)
            })

        return () => {
            cancelled = true
        }
    }, [mapping])

    const ActiveVisual = resolvedVisual

    return (
        <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black">
            {ActiveVisual && isVisualUnique ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                        exit={{ opacity: 0, clipPath: "inset(0 0 0 100%)" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full"
                    >
                        <ActiveVisual />
                    </motion.div>
                </AnimatePresence>
            ) : (
                <div className="h-48 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    {!isVisualUnique && (
                        <span className="ml-3 text-sm text-muted-foreground">Running concurrent operation...</span>
                    )}
                </div>
            )}
        </div>
    )
}
