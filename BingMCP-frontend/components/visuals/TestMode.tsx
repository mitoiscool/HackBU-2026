"use client"

import { useEffect, useState, type ComponentType } from "react"
import { Bus, Dumbbell, LibraryBig, Shirt, Sparkles, UtensilsCrossed, type LucideIcon } from "lucide-react"

type VisualId = "bus" | "dining" | "gym" | "laundry" | "library" | "fallback"

type VisualModule = {
  default?: unknown
  [key: string]: unknown
}

type VisualSpec = {
  id: VisualId
  label: string
  icon: LucideIcon
  tool: string
  motionProfile: string
  description: string
  palette: string[]
  exportName: string
  load: () => Promise<VisualModule>
}

const VISUALS: VisualSpec[] = [
  {
    id: "bus",
    label: "Bus Tracker",
    icon: Bus,
    tool: "occt_get_locations",
    motionProfile: "Linear sweep with road streaks",
    description: "Transit loading state that implies movement and ETA updates.",
    palette: ["#10b981", "#0f172a", "#e2e8f0"],
    exportName: "BusVisual",
    load: () => import("./bus/BusVisual") as Promise<VisualModule>,
  },
  {
    id: "dining",
    label: "Dining Finder",
    icon: UtensilsCrossed,
    tool: "sodexo_menu_query",
    motionProfile: "Wireframe tray with scanline sweep, grid drift, and utensil oscillation",
    description: "Neon overhead tray: center plate + food blob + top-right glass in strict holographic tones.",
    palette: ["#ffffff", "#00aaff", "#00ff88"],
    exportName: "DiningVisual",
    load: () => import("./dining/DiningVisual") as Promise<VisualModule>,
  },
  {
    id: "gym",
    label: "Gym Capacity",
    icon: Dumbbell,
    tool: "binggym_status",
    motionProfile: "Bounce loop with shadow compression",
    description: "Workout capacity check state with energetic timing.",
    palette: ["#0f172a", "#475569", "#e2e8f0"],
    exportName: "GymVisual",
    load: () => import("./gym/GymVisual") as Promise<VisualModule>,
  },
  {
    id: "laundry",
    label: "Laundry Status",
    icon: Shirt,
    tool: "laundry_room_status",
    motionProfile: "Continuous circular spin",
    description: "Machine polling visual that resembles a washer drum.",
    palette: ["#06b6d4", "#3b82f6", "#f97316"],
    exportName: "LaundryVisual",
    load: () => import("./laundry/LaundryVisual") as Promise<VisualModule>,
  },
  {
    id: "library",
    label: "Library Rooms",
    icon: LibraryBig,
    tool: "libcal_room_search",
    motionProfile: "Vertical scan pass",
    description: "Study room availability check with scanline feedback.",
    palette: ["#f59e0b", "#f97316", "#10b981"],
    exportName: "LibraryVisual",
    load: () => import("./library/LibraryVisual") as Promise<VisualModule>,
  },
  {
    id: "fallback",
    label: "Fallback",
    icon: Sparkles,
    tool: "unknown_tool",
    motionProfile: "Orbital pulse rings",
    description: "Safe default when a tool has no mapped visual yet.",
    palette: ["#d946ef", "#22d3ee", "#6366f1"],
    exportName: "FallbackVisual",
    load: () => import("./shared/FallbackVisual") as Promise<VisualModule>,
  },
]

const VISUALS_BY_ID = Object.fromEntries(VISUALS.map((visual) => [visual.id, visual])) as Record<VisualId, VisualSpec>

function resolveComponent(module: VisualModule, exportName: string): ComponentType | null {
  const candidate = module[exportName] ?? module.default
  if (typeof candidate === "function") {
    return candidate as ComponentType
  }
  return null
}

export function TestMode() {
  const [activeVisualId, setActiveVisualId] = useState<VisualId>("bus")
  const [resolvedVisual, setResolvedVisual] = useState<{ id: VisualId; component: ComponentType | null } | null>(null)

  const active = VISUALS_BY_ID[activeVisualId]

  useEffect(() => {
    let cancelled = false

    active
      .load()
      .then((module) => {
        if (cancelled) return
        setResolvedVisual({ id: active.id, component: resolveComponent(module, active.exportName) })
      })
      .catch(() => {
        if (cancelled) return
        setResolvedVisual({ id: active.id, component: null })
      })

    return () => {
      cancelled = true
    }
  }, [active])

  const isResolved = resolvedVisual?.id === active.id
  const ActiveVisual = isResolved ? resolvedVisual.component : null

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Visual Test Mode</h2>
          <p className="text-sm text-muted-foreground">Switch tabs to render each real loading visual module.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-wrap gap-2 lg:flex-col" aria-label="Loading visual tabs">
          {VISUALS.map((visual) => {
            const Icon = visual.icon
            const isActive = visual.id === activeVisualId

            return (
              <button
                key={visual.id}
                type="button"
                onClick={() => setActiveVisualId(visual.id)}
                className={[
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                  isActive
                    ? "border-foreground/30 bg-foreground/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <Icon className="h-4 w-4" />
                <span>{visual.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="h-64 w-full overflow-hidden rounded-xl border border-border bg-muted/30">
            {ActiveVisual ? <ActiveVisual /> : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current visual</p>
              <p className="mt-1 text-sm font-medium text-foreground">{active.label}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tool mapping</p>
              <p className="mt-1 text-sm font-medium text-foreground">{active.tool}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Behavior</p>
              <p className="mt-1 text-sm text-foreground">{active.motionProfile}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Purpose</p>
              <p className="mt-1 text-sm text-foreground">{active.description}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Module status</p>
              <p className="mt-1 text-sm text-foreground">
                {!isResolved ? "Resolving module..." : ActiveVisual ? `Loaded export: ${active.exportName}` : "Empty module or missing export (rendering nothing)."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {active.palette.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {color}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
