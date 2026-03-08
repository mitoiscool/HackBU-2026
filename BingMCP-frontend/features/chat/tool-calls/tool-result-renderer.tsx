import { BusResult } from "./bus-result"
import { DiningStatusResult } from "./dining-status-result"
import { DiningMenuResult } from "./dining-menu-result"
import { GymResult } from "./gym-result"
import { LaundryResult } from "./laundry-result"
import { EventsResult } from "./events-result"
import { FallbackResult } from "./fallback-result"

export function ToolResultRenderer({
    toolName,
    result,
}: {
    toolName: string
    result: unknown
}) {
    const data = (result ?? {}) as Record<string, unknown>

    if (data.status === "unavailable") {
        return (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive">
                <span className="font-semibold">Unavailable</span>
                {typeof data.reason === "string" && data.reason.trim() !== "" && (
                    <span className="text-destructive/70 ml-1">— {data.reason}</span>
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
        case "get_bengaged_events":
            return <EventsResult data={data} />
        default:
            return <FallbackResult data={data} />
    }
}
