import { NextRequest, NextResponse } from "next/server"
import type { DashboardMenuPayload, DashboardSection, DiningMenuData } from "@/lib/dashboard/types"
import { DINING_HALL_OPTIONS, type DiningHallPreference } from "@/lib/preferences"
import {
  closeMcpClient,
  connectMcpClient,
  executeMcpTool,
  getErrorReason,
  getMcpTools,
} from "@/lib/server/mcp-client"

const VALID_HALLS = new Set<string>(DINING_HALL_OPTIONS.map((option) => option.value))

function resolveHall(rawHall: string | null): DiningHallPreference | null {
  if (!rawHall || !VALID_HALLS.has(rawHall)) {
    return null
  }

  return rawHall as DiningHallPreference
}

function unavailableSection(reason: string): DashboardSection<DiningMenuData> {
  return {
    status: "unavailable",
    reason,
  }
}

function normalizeMenuPayload(payload: Record<string, unknown>): DashboardSection<DiningMenuData> {
  if (payload.status === "unavailable") {
    return unavailableSection(typeof payload.reason === "string" ? payload.reason : "Tool unavailable")
  }

  return {
    status: "ok",
    data: payload as DiningMenuData,
  }
}

export async function GET(request: NextRequest) {
  const hall = resolveHall(request.nextUrl.searchParams.get("hall"))

  if (!hall) {
    const payload: DashboardMenuPayload = {
      generatedAt: new Date().toISOString(),
      hall: DINING_HALL_OPTIONS[0].value,
      menu: unavailableSection("Invalid hall. Use one of: hinman, ciw, c4, appalachian."),
    }

    return NextResponse.json(payload)
  }

  let mcpClient = null

  try {
    mcpClient = await connectMcpClient("baxter-dashboard-menu")
    const tools = await getMcpTools(mcpClient)
    const result = await executeMcpTool(tools, "get_dining_menu", { hall })

    const payload: DashboardMenuPayload = {
      generatedAt: new Date().toISOString(),
      hall,
      menu: normalizeMenuPayload(result),
    }

    return NextResponse.json(payload)
  } catch (error) {
    const payload: DashboardMenuPayload = {
      generatedAt: new Date().toISOString(),
      hall,
      menu: unavailableSection(getErrorReason(error)),
    }

    return NextResponse.json(payload)
  } finally {
    await closeMcpClient(mcpClient)
  }
}
