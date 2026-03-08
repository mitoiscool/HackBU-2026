"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, ArrowLeft, LayoutDashboard, Loader2, RefreshCw, WashingMachine, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BusVisual } from "@/components/visuals/bus/BusVisual"
import { DiningVisual } from "@/components/visuals/dining/DiningVisual"
import { GymVisual } from "@/components/visuals/gym/GymVisual"
import { LaundryVisual } from "@/components/visuals/laundry/LaundryVisual"
import { MobileBottomTabs } from "@/components/navigation/MobileBottomTabs"
import { getToolMeta } from "@/features/chat/tool-calls/meta"
import { BusResult } from "@/features/chat/tool-calls/bus-result"
import { DiningMenuResult } from "@/features/chat/tool-calls/dining-menu-result"
import { DiningStatusResult } from "@/features/chat/tool-calls/dining-status-result"
import { GymResult } from "@/features/chat/tool-calls/gym-result"
import { LaundryResult } from "@/features/chat/tool-calls/laundry-result"
import type {
  BusData,
  DashboardMenuPayload,
  DashboardPayload,
  DashboardSection,
  DiningMenuData,
  LaundryData,
} from "@/lib/dashboard/types"
import {
  BUILDING_OPTIONS,
  DINING_HALL_OPTIONS,
  normalizePreferences,
  type BuildingPreference,
  type DiningHallPreference,
} from "@/lib/preferences"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const AUTO_REFRESH_MS = 60_000

const SELECT_CLASSNAME =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

type MenuCacheEntry = {
  dateKey: string
  section: DashboardSection<DiningMenuData>
}

type MenuCacheByHall = Partial<Record<DiningHallPreference, MenuCacheEntry>>
type MenuLoadingByHall = Partial<Record<DiningHallPreference, boolean>>

function isSectionOk<T extends Record<string, unknown>>(
  section: DashboardSection<T> | undefined
): section is { status: "ok"; data: T } {
  return Boolean(section && section.status === "ok")
}

function getEtDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

function UnavailableNotice({ reason }: { reason: string }) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
      <span className="font-semibold">Unavailable</span>
      {reason.trim().length > 0 && <span className="ml-1 text-destructive/80">- {reason}</span>}
    </div>
  )
}

function DashboardCard({
  toolName,
  title,
  children,
}: {
  toolName: string
  title: string
  children: React.ReactNode
}) {
  const meta = getToolMeta(toolName)

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="flex items-center gap-2.5 border-b border-border/60 bg-muted/20 px-4 py-3">
        <span className="text-primary">{meta.icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="space-y-3 px-4 py-4">{children}</div>
    </motion.section>
  )
}

function OverlayModal({
  open,
  title,
  onClose,
  mobileFullscreen = false,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  mobileFullscreen?: boolean
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed inset-0 z-50 flex ${
            mobileFullscreen
              ? "items-end justify-center p-0 md:items-center md:p-8"
              : "items-center justify-center p-4 md:p-8"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close overlay"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={`relative z-10 flex w-full flex-col overflow-hidden bg-card ${
              mobileFullscreen
                ? "h-svh max-h-svh max-w-none rounded-none border-x-0 border-b-0 border-t border-border md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl md:border"
                : "max-h-[85vh] max-w-2xl rounded-2xl border border-border"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function getLaundryVisualState(laundrySection: DashboardSection<LaundryData> | undefined): { taken: number; free: number } {
  if (!isSectionOk(laundrySection)) {
    return { taken: 3, free: 3 }
  }

  const total = laundrySection.data.washers.total
  const available = laundrySection.data.washers.available
  const taken = Math.max(0, total - available)

  return {
    taken,
    free: Math.max(0, available),
  }
}

function summarizeBus(section: DashboardSection<BusData> | undefined): { routeCount: number; nextEta: string } {
  if (!isSectionOk(section)) {
    return { routeCount: 0, nextEta: "-" }
  }

  const routeCount = section.data.routes.length
  const firstRoute = section.data.routes[0]

  return {
    routeCount,
    nextEta: firstRoute ? String(firstRoute.next_arrival_minutes) : "-",
  }
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLaundryRefreshing, setIsLaundryRefreshing] = useState(false)
  const [isBusOverlayOpen, setIsBusOverlayOpen] = useState(false)
  const [activeDiningHall, setActiveDiningHall] = useState<DiningHallPreference | null>(null)

  const [laundryBuilding, setLaundryBuilding] = useState<BuildingPreference>(BUILDING_OPTIONS[0].value)

  const [menuCacheByHall, setMenuCacheByHall] = useState<MenuCacheByHall>({})
  const [menuLoadingByHall, setMenuLoadingByHall] = useState<MenuLoadingByHall>({})

  const fetchDashboard = useCallback(
    async ({ showInitialLoader, building }: { showInitialLoader: boolean; building: BuildingPreference }) => {
      if (showInitialLoader) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const response = await fetch(`/api/dashboard?laundryBuilding=${encodeURIComponent(building)}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Dashboard request failed (${response.status})`)
        }

        const payload = (await response.json()) as DashboardPayload
        setDashboard(payload)
        setRequestError(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load dashboard"
        setRequestError(message)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    []
  )

  const refreshLaundrySection = useCallback(async (building: BuildingPreference) => {
    setIsLaundryRefreshing(true)

    try {
      const response = await fetch(`/api/dashboard?laundryBuilding=${encodeURIComponent(building)}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Laundry request failed (${response.status})`)
      }

      const payload = (await response.json()) as DashboardPayload

      setDashboard((previous) => {
        if (!previous) {
          return payload
        }

        return {
          ...previous,
          generatedAt: payload.generatedAt,
          laundryBuilding: payload.laundryBuilding,
          laundry: payload.laundry,
        }
      })
      setRequestError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh laundry"
      setRequestError(message)
    } finally {
      setIsLaundryRefreshing(false)
    }
  }, [])

  const fetchHallMenu = useCallback(
    async (hall: DiningHallPreference) => {
      const currentEtDate = getEtDateKey()
      const cached = menuCacheByHall[hall]
      if (cached && cached.dateKey === currentEtDate) {
        return
      }

      setMenuLoadingByHall((prev) => ({ ...prev, [hall]: true }))

      try {
        const response = await fetch(`/api/dashboard/menu?hall=${encodeURIComponent(hall)}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Menu request failed (${response.status})`)
        }

        const payload = (await response.json()) as DashboardMenuPayload
        const dateKey =
          payload.menu.status === "ok" && typeof payload.menu.data.date === "string"
            ? payload.menu.data.date
            : currentEtDate

        setMenuCacheByHall((prev) => ({
          ...prev,
          [hall]: {
            dateKey,
            section: payload.menu,
          },
        }))
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Failed to load menu"
        setMenuCacheByHall((prev) => ({
          ...prev,
          [hall]: {
            dateKey: currentEtDate,
            section: {
              status: "unavailable",
              reason,
            },
          },
        }))
      } finally {
        setMenuLoadingByHall((prev) => ({ ...prev, [hall]: false }))
      }
    },
    [menuCacheByHall]
  )

  useEffect(() => {
    let resolvedBuilding: BuildingPreference = BUILDING_OPTIONS[0].value

    try {
      const normalized = normalizePreferences({
        building: window.localStorage.getItem("building") ?? undefined,
      })

      if (normalized.building) {
        resolvedBuilding = normalized.building
        setLaundryBuilding(normalized.building)
      }
    } catch {
      // Ignore localStorage access errors.
    } finally {
      setIsHydrated(true)
      void fetchDashboard({ showInitialLoader: true, building: resolvedBuilding })
    }
  }, [fetchDashboard])

  useEffect(() => {
    if (!isHydrated) return

    const timer = window.setInterval(() => {
      void fetchDashboard({ showInitialLoader: false, building: laundryBuilding })
    }, AUTO_REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [fetchDashboard, isHydrated, laundryBuilding])

  useEffect(() => {
    if (!isBusOverlayOpen && !activeDiningHall) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setIsBusOverlayOpen(false)
      setActiveDiningHall(null)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeDiningHall, isBusOverlayOpen])

  const handleLaundryBuildingChange = (value: string) => {
    const isValid = BUILDING_OPTIONS.some((option) => option.value === value)
    if (!isValid) return

    const nextBuilding = value as BuildingPreference
    setLaundryBuilding(nextBuilding)

    try {
      window.localStorage.setItem("building", nextBuilding)
    } catch {
      // Ignore localStorage access errors.
    }

    void refreshLaundrySection(nextBuilding)
  }

  const handleDiningHallOpen = (hall: DiningHallPreference) => {
    setActiveDiningHall(hall)
    void fetchHallMenu(hall)
  }

  const busSummary = summarizeBus(dashboard?.bus)
  const laundryVisualState = getLaundryVisualState(dashboard?.laundry)

  const activeDiningOption = activeDiningHall
    ? DINING_HALL_OPTIONS.find((option) => option.value === activeDiningHall)
    : undefined
  const activeDiningStatus = activeDiningHall ? dashboard?.diningStatusByHall[activeDiningHall] : undefined
  const activeMenuEntry = activeDiningHall ? menuCacheByHall[activeDiningHall] : undefined
  const isActiveMenuLoading = activeDiningHall ? Boolean(menuLoadingByHall[activeDiningHall]) : false

  return (
    <div className="mobile-content-safe min-h-svh bg-background md:pb-0">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-3 px-4 py-4 md:gap-4 md:px-8 md:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              Live Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Dining, capacity, and transit numbers in one view.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button asChild variant="outline" size="sm" className="hidden rounded-lg sm:inline-flex">
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Chat
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => void fetchDashboard({ showInitialLoader: false, building: laundryBuilding })}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        {requestError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading live metrics...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
            <DashboardCard toolName="get_gym_capacity" title="East Gym">
              <GymVisual className="max-w-none w-full" />
              {isSectionOk(dashboard?.gym) ? (
                <>
                  <GymResult data={dashboard.gym.data} />
                  {typeof dashboard.gym.data.count === "number" && (
                    <div className="rounded-lg border border-border bg-background/60 px-3.5 py-2 text-xs text-muted-foreground">
                      Headcount: <span className="font-mono font-semibold text-foreground">{dashboard.gym.data.count}</span>
                    </div>
                  )}
                </>
              ) : (
                <UnavailableNotice reason={dashboard?.gym.reason ?? "Gym data unavailable"} />
              )}
            </DashboardCard>

            <DashboardCard toolName="get_laundry_availability" title="Laundry Room">
              <div className="flex flex-wrap items-center gap-2">
                <WashingMachine className="h-4 w-4 text-primary" />
                <select
                  value={laundryBuilding}
                  onChange={(event) => handleLaundryBuildingChange(event.target.value)}
                  className={`${SELECT_CLASSNAME} w-full sm:flex-1`}
                >
                  {BUILDING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isLaundryRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              <LaundryVisual className="max-w-none w-full" taken={laundryVisualState.taken} free={laundryVisualState.free} />

              {isSectionOk(dashboard?.laundry) ? (
                <LaundryResult data={dashboard.laundry.data} />
              ) : (
                <UnavailableNotice reason={dashboard?.laundry.reason ?? "Laundry data unavailable"} />
              )}
            </DashboardCard>

            <DashboardCard toolName="get_bus_locations" title="Bus Routes">
              <BusVisual className="max-w-none w-full" />

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-background/60 px-3.5 py-2 text-xs text-muted-foreground">
                <span>
                  Active routes: <span className="font-mono font-semibold text-foreground">{busSummary.routeCount}</span>
                </span>
                <span>
                  Next ETA: <span className="font-mono font-semibold text-foreground">{busSummary.nextEta}</span>
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-center rounded-lg"
                onClick={() => setIsBusOverlayOpen(true)}
              >
                View all active routes
              </Button>
            </DashboardCard>

            <DashboardCard toolName="get_dining_menu" title="Dining Halls">
              <DiningVisual className="max-w-none w-full" />

              <div className="space-y-2">
                {DINING_HALL_OPTIONS.map((option) => {
                  const hall = option.value
                  const diningStatus = dashboard?.diningStatusByHall[hall]

                  const badgeClass = isSectionOk(diningStatus)
                    ? diningStatus.data.is_open
                      ? "bg-primary/15 text-primary"
                      : "bg-destructive/15 text-destructive"
                    : "bg-destructive/10 text-destructive"

                  const badgeLabel = isSectionOk(diningStatus)
                    ? diningStatus.data.is_open
                      ? "Open"
                      : "Closed"
                    : "Unavailable"

                  return (
                    <button
                      key={hall}
                      type="button"
                      onClick={() => handleDiningHallOpen(hall)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-tool-call-border bg-tool-call-bg px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-tool-call-border/30"
                    >
                      <span className="flex-1 text-xs font-medium text-foreground">{option.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </DashboardCard>
          </div>
        )}
      </div>

      <OverlayModal
        open={isBusOverlayOpen}
        title="All Active Bus Routes"
        mobileFullscreen
        onClose={() => setIsBusOverlayOpen(false)}
      >
        {isSectionOk(dashboard?.bus) ? (
          <BusResult data={dashboard.bus.data} />
        ) : (
          <UnavailableNotice reason={dashboard?.bus.reason ?? "Bus data unavailable"} />
        )}
      </OverlayModal>

      <OverlayModal
        open={Boolean(activeDiningHall)}
        title={activeDiningOption?.label ?? "Dining Hall"}
        mobileFullscreen
        onClose={() => setActiveDiningHall(null)}
      >
        <div className="space-y-3">
          {isSectionOk(activeDiningStatus) ? (
            <DiningStatusResult data={activeDiningStatus.data} />
          ) : (
            <UnavailableNotice reason={activeDiningStatus?.reason ?? "Dining status unavailable"} />
          )}

          {isActiveMenuLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3.5 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading menu...
            </div>
          ) : activeMenuEntry ? (
            activeMenuEntry.section.status === "ok" ? (
              <DiningMenuResult data={activeMenuEntry.section.data} />
            ) : (
              <UnavailableNotice reason={activeMenuEntry.section.reason} />
            )
          ) : (
            <div className="rounded-lg border border-border bg-background/60 px-3.5 py-2 text-xs text-muted-foreground">
              Loading today&apos;s menu...
            </div>
          )}
        </div>
      </OverlayModal>

      <MobileBottomTabs activeRoute="dashboard" />
    </div>
  )
}
