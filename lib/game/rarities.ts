export type RarityId =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"

export interface Rarity {
  id: RarityId
  name: string
  /** tailwind-agnostic hex used on canvas */
  color: string
  glow: string
  /** relative spawn weight — higher = more common */
  weight: number
  /** stat multiplier applied to hp / reward */
  mult: number
  /** reward multiplier for coins */
  reward: number
}

export const RARITIES: Record<RarityId, Rarity> = {
  common: {
    id: "common",
    name: "Common",
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.5)",
    weight: 100,
    mult: 1,
    reward: 1,
  },
  uncommon: {
    id: "uncommon",
    name: "Uncommon",
    color: "#4ade80",
    glow: "rgba(74,222,128,0.6)",
    weight: 55,
    mult: 1.6,
    reward: 2,
  },
  rare: {
    id: "rare",
    name: "Rare",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.65)",
    weight: 28,
    mult: 2.6,
    reward: 4,
  },
  epic: {
    id: "epic",
    name: "Epic",
    color: "#c084fc",
    glow: "rgba(192,132,252,0.7)",
    weight: 12,
    mult: 4.2,
    reward: 8,
  },
  legendary: {
    id: "legendary",
    name: "Legendary",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.8)",
    weight: 4,
    mult: 7,
    reward: 18,
  },
  mythic: {
    id: "mythic",
    name: "Mythic",
    color: "#fb7185",
    glow: "rgba(251,113,133,0.9)",
    weight: 1.2,
    mult: 12,
    reward: 45,
  },
}

export const RARITY_ORDER: RarityId[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
]

const TOTAL_WEIGHT = RARITY_ORDER.reduce(
  (sum, id) => sum + RARITIES[id].weight,
  0,
)

/** Roll a rarity, biased upward by `luck` (0 = none). */
export function rollRarity(luck = 0): RarityId {
  // luck shifts the roll toward the rare end
  const roll = Math.random() * TOTAL_WEIGHT
  let acc = 0
  // apply luck by re-weighting: reduce common weight, add to top tiers
  const weights = RARITY_ORDER.map((id, i) => {
    const base = RARITIES[id].weight
    const boost = 1 + luck * i * 0.15
    return base * (i === 0 ? Math.max(0.3, 1 - luck * 0.4) : boost)
  })
  const total = weights.reduce((a, b) => a + b, 0)
  const r = Math.random() * total
  void roll
  void acc
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    acc += weights[i]
    if (r <= acc) return RARITY_ORDER[i]
  }
  return "common"
}
