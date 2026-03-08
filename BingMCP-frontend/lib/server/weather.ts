import "server-only"

const BINGHAMTON_LABEL = "Binghamton, NY"
const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=42.0987&longitude=-75.9180&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York"
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000

type CachedWeather = {
  snapshot: WeatherSnapshot
  expiresAtMs: number
}

declare global {
  var __baxterBinghamtonWeatherCache: CachedWeather | undefined
}

type OpenMeteoCurrent = {
  temperature_2m?: unknown
  weather_code?: unknown
  time?: unknown
}

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent
  utc_offset_seconds?: unknown
}

export type WeatherSnapshotOk = {
  status: "ok"
  location: string
  temperatureF: number
  condition: string
  observedAt: string
  summary: string
}

export type WeatherSnapshotUnavailable = {
  status: "unavailable"
  reason: string
}

export type WeatherSnapshot = WeatherSnapshotOk | WeatherSnapshotUnavailable

function getCachedWeather(): CachedWeather | null {
  const cache = globalThis.__baxterBinghamtonWeatherCache
  if (!cache) return null
  if (cache.expiresAtMs <= Date.now()) return null
  return cache
}

function setCachedWeather(snapshot: WeatherSnapshot): void {
  globalThis.__baxterBinghamtonWeatherCache = {
    snapshot,
    expiresAtMs: Date.now() + WEATHER_CACHE_TTL_MS,
  }
}

function toErrorReason(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error
  }
  return "Weather request failed"
}

function mapWmoCodeToCondition(code: number): string {
  if (code === 0) return "Clear"
  if (code >= 1 && code <= 3) return "Cloudy"
  if (code === 45 || code === 48) return "Fog"
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain"
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow"
  if (code >= 95 && code <= 99) return "Thunderstorms"
  return "Cloudy"
}

function toDisplayTemperature(temperatureF: number): string {
  return Number.isInteger(temperatureF) ? `${temperatureF}` : temperatureF.toFixed(1)
}

function toObservedAtIso(localTime: string, utcOffsetSeconds: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localTime)
  if (!match) return null

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if ([year, month, day, hour, minute].some((value) => !Number.isFinite(value))) {
    return null
  }

  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - utcOffsetSeconds * 1000
  return new Date(utcMs).toISOString()
}

async function fetchWeatherSnapshot(): Promise<WeatherSnapshot> {
  try {
    const response = await fetch(OPEN_METEO_URL, { cache: "no-store" })
    if (!response.ok) {
      return {
        status: "unavailable",
        reason: `Weather API request failed (${response.status})`,
      }
    }

    const payload = (await response.json()) as OpenMeteoResponse
    const current = payload.current

    const temperatureRaw = current?.temperature_2m
    const weatherCodeRaw = current?.weather_code
    const localTimeRaw = current?.time
    const offsetRaw = payload.utc_offset_seconds

    if (
      typeof temperatureRaw !== "number" ||
      typeof weatherCodeRaw !== "number" ||
      typeof localTimeRaw !== "string"
    ) {
      return {
        status: "unavailable",
        reason: "Weather API returned an unexpected payload",
      }
    }

    const temperatureF = Math.round(temperatureRaw * 10) / 10
    const condition = mapWmoCodeToCondition(weatherCodeRaw)
    const observedAt =
      toObservedAtIso(localTimeRaw, typeof offsetRaw === "number" ? offsetRaw : 0) ?? new Date().toISOString()

    return {
      status: "ok",
      location: BINGHAMTON_LABEL,
      temperatureF,
      condition,
      observedAt,
      summary: `${toDisplayTemperature(temperatureF)}°F • ${condition}`,
    }
  } catch (error) {
    return {
      status: "unavailable",
      reason: toErrorReason(error),
    }
  }
}

export async function getBinghamtonWeather(): Promise<WeatherSnapshot> {
  const cached = getCachedWeather()
  if (cached) {
    return cached.snapshot
  }

  const snapshot = await fetchWeatherSnapshot()
  setCachedWeather(snapshot)
  return snapshot
}
