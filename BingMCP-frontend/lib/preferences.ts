export const BUILDING_OPTIONS = [
  { value: "windham_g14", label: "Windham (G14)" },
  { value: "bingham_122", label: "Bingham (122)" },
  { value: "brandywine_116a", label: "Brandywine (116A)" },
  { value: "broome_g18", label: "Broome (G18)" },
  { value: "cascade_g14", label: "Cascade (G14)" },
  { value: "cayuga_209", label: "Cayuga (209)" },
  { value: "choconut_116a", label: "Choconut (116A)" },
  { value: "cleveland_lr", label: "Cleveland (Lower Room)" },
  { value: "delaware_117", label: "Delaware (117)" },
  { value: "digman_g11", label: "Digman (G11)" },
  { value: "endicott_g26", label: "Endicott (G26)" },
  { value: "glenwood_116a", label: "Glenwood (116A)" },
  { value: "hughes_a_b1", label: "Hughes A (B1)" },
  { value: "hughes_b_b7", label: "Hughes B (B7)" },
  { value: "hunter_g14", label: "Hunter (G14)" },
  { value: "johnson_g25a", label: "Johnson (G25A)" },
  { value: "lehman_a_b1", label: "Lehman A (B1)" },
  { value: "lehman_b_b7", label: "Lehman B (B7)" },
  { value: "marcy_g14", label: "Marcy (G14)" },
  { value: "mohawk_g05", label: "Mohawk (G05)" },
  { value: "nanticoke_116a", label: "Nanticoke (116A)" },
  { value: "oconnor_g06", label: "O'Connor (G06)" },
  { value: "old_digman", label: "Old Digman" },
  { value: "oneida_111", label: "Oneida (111)" },
  { value: "onondaga", label: "Onondaga" },
  { value: "rafuse_124", label: "Rafuse (124)" },
  { value: "roosevelt_a_b1", label: "Roosevelt A (B1)" },
  { value: "roosevelt_b_b7", label: "Roosevelt B (B7)" },
  { value: "seneca_107", label: "Seneca (107)" },
  { value: "smith_b_b7", label: "Smith B (B7)" },
  { value: "smith_dorm_a_b1", label: "Smith Dorm A (B1)" },
] as const

export const DINING_HALL_OPTIONS = [
  { value: "hinman", label: "Hinman Dining Hall" },
  { value: "ciw", label: "CIW Dining Hall" },
  { value: "c4", label: "C4 Dining Hall" },
  { value: "appalachian", label: "Appalachian Dining Hall" },
] as const

export type BuildingPreference = (typeof BUILDING_OPTIONS)[number]["value"]
export type DiningHallPreference = (typeof DINING_HALL_OPTIONS)[number]["value"]

export type PreferencesInput = {
  building?: unknown
  preferredDiningHall?: unknown
}

export type NormalizedPreferences = {
  building?: BuildingPreference
  preferredDiningHall?: DiningHallPreference
}

const BUILDING_SET = new Set<string>(BUILDING_OPTIONS.map((option) => option.value))
const DINING_HALL_SET = new Set<string>(DINING_HALL_OPTIONS.map((option) => option.value))
const BUILDING_LABELS = new Map<string, string>(BUILDING_OPTIONS.map((option) => [option.value, option.label]))
const DINING_HALL_LABELS = new Map<string, string>(DINING_HALL_OPTIONS.map((option) => [option.value, option.label]))

export function normalizePreferences(input: PreferencesInput | undefined): NormalizedPreferences {
  const building =
    typeof input?.building === "string" && BUILDING_SET.has(input.building)
      ? (input.building as BuildingPreference)
      : undefined

  const preferredDiningHall =
    typeof input?.preferredDiningHall === "string" && DINING_HALL_SET.has(input.preferredDiningHall)
      ? (input.preferredDiningHall as DiningHallPreference)
      : undefined

  return { building, preferredDiningHall }
}

export function getBuildingLabel(building: string | undefined): string | undefined {
  if (!building) return undefined
  return BUILDING_LABELS.get(building)
}

export function getBuildingStub(building: string | undefined): string | undefined {
  const label = getBuildingLabel(building)
  if (!label) return undefined
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

export function getDiningHallLabel(diningHall: string | undefined): string | undefined {
  if (!diningHall) return undefined
  return DINING_HALL_LABELS.get(diningHall)
}
