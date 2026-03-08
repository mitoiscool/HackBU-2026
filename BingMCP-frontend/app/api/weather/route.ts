import { NextResponse } from "next/server"
import { getBinghamtonWeather } from "@/lib/server/weather"

export async function GET() {
  const weather = await getBinghamtonWeather()
  return NextResponse.json(weather)
}
