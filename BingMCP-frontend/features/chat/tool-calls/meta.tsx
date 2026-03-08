import { ReactNode } from "react"
import { Bus, UtensilsCrossed, Dumbbell, WashingMachine, Circle, Clock, CalendarDays } from "lucide-react"

export const TOOL_META: Record<string, { label: string; icon: ReactNode }> = {
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
    get_available_library_rooms: {
        label: "Finding Study Rooms",
        icon: <Circle className="h-3.5 w-3.5" />,
    },
    get_bengaged_events: {
        label: "Fetching Events",
        icon: <CalendarDays className="h-3.5 w-3.5" />,
    },
}

export function getToolMeta(toolName: string) {
    return TOOL_META[toolName] ?? { label: toolName, icon: <Clock className="h-3.5 w-3.5" /> }
}
