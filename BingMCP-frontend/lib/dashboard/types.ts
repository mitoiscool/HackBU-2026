import type { BuildingPreference, DiningHallPreference } from "@/lib/preferences"

export type DashboardSectionOk<T extends Record<string, unknown>> = {
  status: "ok"
  data: T
}

export type DashboardSectionUnavailable = {
  status: "unavailable"
  reason: string
}

export type DashboardSection<T extends Record<string, unknown>> =
  | DashboardSectionOk<T>
  | DashboardSectionUnavailable

export type BusRouteData = {
  name: string
  next_arrival_minutes: number | string
  current_stop: string
}

export type BusData = {
  routes: BusRouteData[]
}

export type GymData = {
  capacity_percent: number
  is_open: boolean
  count?: number
  hours?: string
}

export type LaundryData = {
  building: string
  washers: {
    available: number
    total: number
  }
  dryers: {
    available: number
    total: number
  }
}

export type DiningStatusData = {
  hall: string
  is_open: boolean
  hours: string
  intervals?: unknown[]
  timezone?: string
  source?: string
}

export type DiningMenuData = {
  hall: string
  date: string
  summary?: {
    meal_count: number
    station_count: number
    item_count: number
  }
  meals?: Array<Record<string, unknown>>
}

export type DiningStatusByHall = Record<DiningHallPreference, DashboardSection<DiningStatusData>>

export type DashboardPayload = {
  generatedAt: string
  refreshIntervalSec: number
  laundryBuilding: BuildingPreference
  gym: DashboardSection<GymData>
  bus: DashboardSection<BusData>
  laundry: DashboardSection<LaundryData>
  diningStatusByHall: DiningStatusByHall
}

export type DashboardMenuPayload = {
  generatedAt: string
  hall: DiningHallPreference
  menu: DashboardSection<DiningMenuData>
}
