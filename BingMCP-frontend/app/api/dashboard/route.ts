import { NextRequest, NextResponse } from "next/server"
import type {
  BusData,
  DashboardPayload,
  DashboardSection,
  DiningStatusByHall,
  DiningStatusData,
  GymData,
  LaundryData,
} from "@/lib/dashboard/types"
import {
  BUILDING_OPTIONS,
  DINING_HALL_OPTIONS,
  type BuildingPreference,
  type DiningHallPreference,
} from "@/lib/preferences"
import {
  closeMcpClient,
  connectMcpClient,
  executeMcpTool,
  getErrorReason,
  getMcpTools,
  type McpTools,
} from "@/lib/server/mcp-client"

const REFRESH_INTERVAL_SEC = 60
const DEFAULT_BUILDING = BUILDING_OPTIONS[0].value
const VALID_BUILDINGS = new Set<string>(BUILDING_OPTIONS.map((option) => option.value))

function isUnavailablePayload(payload: Record<string, unknown>): payload is { status: "unavailable"; reason?: unknown } {
  return payload.status === "unavailable"
}

function toUnavailable<T extends Record<string, unknown>>(reason: string): DashboardSection<T> {
  return {
    status: "unavailable",
    reason,
  }
}

function toSection<T extends Record<string, unknown>>(payload: Record<string, unknown>): DashboardSection<T> {
  if (isUnavailablePayload(payload)) {
    return {
      status: "unavailable",
      reason: typeof payload.reason === "string" && payload.reason.trim().length > 0 ? payload.reason : "Tool unavailable",
    }
  }

  return {
    status: "ok",
    data: payload as T,
  }
}

async function callToolSection<T extends Record<string, unknown>>(
  tools: McpTools,
  toolName: string,
  input: Record<string, unknown> = {}
): Promise<DashboardSection<T>> {
  try {
    const payload = await executeMcpTool(tools, toolName, input)
    return toSection<T>(payload)
  } catch (error) {
    return toUnavailable<T>(getErrorReason(error))
  }
}

function resolveBuilding(queryBuilding: string | null): BuildingPreference {
  if (queryBuilding && VALID_BUILDINGS.has(queryBuilding)) {
    return queryBuilding as BuildingPreference
  }
  return DEFAULT_BUILDING
}

async function getDiningStatuses(tools: McpTools): Promise<DiningStatusByHall> {
  const hallEntries = await Promise.all(
    DINING_HALL_OPTIONS.map(async (option) => {
      const hall = option.value as DiningHallPreference
      const status = await callToolSection<DiningStatusData>(tools, "get_dining_status", { hall })
      return [hall, status] as const
    })
  )

  return Object.fromEntries(hallEntries) as DiningStatusByHall
}

export async function GET(request: NextRequest) {
  const laundryBuilding = resolveBuilding(request.nextUrl.searchParams.get("laundryBuilding"))

  let mcpClient = null

  try {
    mcpClient = await connectMcpClient("baxter-dashboard")
    const tools = await getMcpTools(mcpClient)

    const [gym, bus, laundry, diningStatusByHall] = await Promise.all([
      callToolSection<GymData>(tools, "get_gym_capacity"),
      callToolSection<BusData>(tools, "get_bus_locations"),
      callToolSection<LaundryData>(tools, "get_laundry_availability", { building: laundryBuilding }),
      getDiningStatuses(tools),
    ])

    const payload: DashboardPayload = {
      generatedAt: new Date().toISOString(),
      refreshIntervalSec: REFRESH_INTERVAL_SEC,
      laundryBuilding,
      gym,
      bus,
      laundry,
      diningStatusByHall,
    }

    return NextResponse.json(payload)
  } catch (error) {
    const reason = getErrorReason(error)

    const unavailable = {
      status: "unavailable" as const,
      reason,
    }

    const fallbackDining = Object.fromEntries(
      DINING_HALL_OPTIONS.map((option) => [option.value, unavailable])
    ) as DiningStatusByHall

    const fallbackPayload: DashboardPayload = {
      generatedAt: new Date().toISOString(),
      refreshIntervalSec: REFRESH_INTERVAL_SEC,
      laundryBuilding,
      gym: unavailable,
      bus: unavailable,
      laundry: unavailable,
      diningStatusByHall: fallbackDining,
    }

    return NextResponse.json(fallbackPayload)
  } finally {
    await closeMcpClient(mcpClient)
  }
}
