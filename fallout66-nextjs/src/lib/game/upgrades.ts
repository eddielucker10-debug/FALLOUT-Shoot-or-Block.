export type UpgradeId =
  | "damage"
  | "fireRate"
  | "multishot"
  | "spread"
  | "pierce"
  | "crit"
  | "critDamage"
  | "projSpeed"
  | "projSize"
  | "maxHealth"
  | "regen"
  | "shieldPower"
  | "shieldRegen"
  | "shieldCooldown"
  | "lifeSteal"
  | "thorns"
  | "dodge"
  | "moveSpeed"
  | "coinBonus"
  | "scoreBonus"
  | "comboDuration"
  | "luck"
  | "autoTurret"
  | "explosive"
  | "slowField"
  | "magnet";

export interface Upgrade {
  id: UpgradeId;
  name: string;
  desc: string;
  icon: string;
  /** lucide icon name */
  maxTier: number;
  baseCost: number;
  costGrowth: number;
  /** effect value at a given owned tier (tier 0 = not purchased) */
  value: (tier: number) => number;
  /** how the value reads in the UI */
  format: (v: number) => string;
  category: "offense" | "defense" | "utility";
}

/** cost to buy the NEXT tier given the currently owned tier. */
export function upgradeCost(u: Upgrade, ownedTier: number): number {
  return Math.round(u.baseCost * Math.pow(u.costGrowth, ownedTier));
}

export const UPGRADES: Upgrade[] = [
  {
    id: "damage",
    name: "Impact",
    desc: "Increase damage dealt per projectile.",
    icon: "Zap",
    maxTier: 12,
    baseCost: 60,
    costGrowth: 1.5,
    value: (t) => 1 + t * 1.5,
    format: (v) => `${v.toFixed(1)} dmg`,
    category: "offense",
  },
  {
    id: "fireRate",
    name: "Rapid Fire",
    desc: "Fire more shots per second.",
    icon: "Timer",
    maxTier: 10,
    baseCost: 20,
    costGrowth: 1.4,
    value: (t) => 2 + t * 0.7,
    format: (v) => `${v.toFixed(1)}/s`,
    category: "offense",
  },
  {
    id: "multishot",
    name: "Multi-Shot",
    desc: "Fire additional projectiles at once.",
    icon: "GitFork",
    maxTier: 6,
    baseCost: 60,
    costGrowth: 1.8,
    value: (t) => 1 + t,
    format: (v) => `${v} shots`,
    category: "offense",
  },
  {
    id: "spread",
    name: "Scatter",
    desc: "Widen the multi-shot fan for more coverage.",
    icon: "Wind",
    maxTier: 8,
    baseCost: 35,
    costGrowth: 1.4,
    value: (t) => t * 6,
    format: (v) => `${v}°`,
    category: "offense",
  },
  {
    id: "pierce",
    name: "Pierce",
    desc: "Projectiles pass through extra targets.",
    icon: "MoveUp",
    maxTier: 6,
    baseCost: 80,
    costGrowth: 1.7,
    value: (t) => t,
    format: (v) => `+${v} hits`,
    category: "offense",
  },
  {
    id: "crit",
    name: "Critical",
    desc: "Chance to deal triple damage.",
    icon: "Crosshair",
    maxTier: 10,
    baseCost: 45,
    costGrowth: 1.45,
    value: (t) => t * 5,
    format: (v) => `${v}%`,
    category: "offense",
  },
  {
    id: "projSpeed",
    name: "Velocity",
    desc: "Projectiles travel faster.",
    icon: "ArrowUp",
    maxTier: 8,
    baseCost: 18,
    costGrowth: 1.3,
    value: (t) => 480 + t * 90,
    format: (v) => `${Math.round(v)} px/s`,
    category: "offense",
  },
  {
    id: "projSize",
    name: "Caliber",
    desc: "Larger projectiles are easier to land.",
    icon: "Circle",
    maxTier: 6,
    baseCost: 30,
    costGrowth: 1.4,
    value: (t) => 4 + t * 1.6,
    format: (v) => `${v.toFixed(1)} px`,
    category: "offense",
  },
  {
    id: "maxHealth",
    name: "Vitality",
    desc: "Increase maximum hull integrity.",
    icon: "Heart",
    maxTier: 12,
    baseCost: 25,
    costGrowth: 1.35,
    value: (t) => 100 + t * 30,
    format: (v) => `${v} HP`,
    category: "defense",
  },
  {
    id: "regen",
    name: "Repair",
    desc: "Slowly regenerate hull over time.",
    icon: "Activity",
    maxTier: 8,
    baseCost: 40,
    costGrowth: 1.5,
    value: (t) => t * 1.2,
    format: (v) => `${v.toFixed(1)} HP/s`,
    category: "defense",
  },
  {
    id: "shieldPower",
    name: "Shield Core",
    desc: "Increase how much your shield can absorb.",
    icon: "Shield",
    maxTier: 10,
    baseCost: 30,
    costGrowth: 1.4,
    value: (t) => 60 + t * 25,
    format: (v) => `${v} SP`,
    category: "defense",
  },
  {
    id: "shieldRegen",
    name: "Shield Flow",
    desc: "Shield recharges faster while lowered.",
    icon: "RefreshCw",
    maxTier: 8,
    baseCost: 35,
    costGrowth: 1.45,
    value: (t) => 8 + t * 4,
    format: (v) => `${v} SP/s`,
    category: "defense",
  },
  {
    id: "shieldCooldown",
    name: "Overdrive",
    desc: "Reduce delay before shield recharges.",
    icon: "Hourglass",
    maxTier: 6,
    baseCost: 40,
    costGrowth: 1.5,
    value: (t) => Math.max(0.3, 2 - t * 0.3),
    format: (v) => `${v.toFixed(1)}s`,
    category: "defense",
  },
  {
    id: "moveSpeed",
    name: "Thrusters",
    desc: "Move left and right more quickly.",
    icon: "Gauge",
    maxTier: 8,
    baseCost: 20,
    costGrowth: 1.3,
    value: (t) => 380 + t * 55,
    format: (v) => `${Math.round(v)} px/s`,
    category: "utility",
  },
  {
    id: "coinBonus",
    name: "Salvage",
    desc: "Earn more coins from everything you clear.",
    icon: "Coins",
    maxTier: 10,
    baseCost: 50,
    costGrowth: 1.5,
    value: (t) => 1 + t * 0.25,
    format: (v) => `${v.toFixed(2)}x`,
    category: "utility",
  },
  {
    id: "luck",
    name: "Fortune",
    desc: "Shift spawns toward rarer, richer targets.",
    icon: "Sparkles",
    maxTier: 8,
    baseCost: 70,
    costGrowth: 1.6,
    value: (t) => t,
    format: (v) => `+${v} luck`,
    category: "utility",
  },
  {
    id: "autoTurret",
    name: "Auto-Turret",
    desc: "A drone that fires on its own.",
    icon: "Bot",
    maxTier: 5,
    baseCost: 120,
    costGrowth: 1.9,
    value: (t) => t,
    format: (v) => (v > 0 ? `Lv ${v}` : "off"),
    category: "offense",
  },
  {
    id: "explosive",
    name: "Explosive Rounds",
    desc: "Kills deal splash damage to nearby targets.",
    icon: "Bomb",
    maxTier: 6,
    baseCost: 90,
    costGrowth: 1.7,
    value: (t) => t * 18,
    format: (v) => `${v}px blast`,
    category: "offense",
  },
  {
    id: "slowField",
    name: "Slow Field",
    desc: "Everything falls slower toward you.",
    icon: "Snowflake",
    maxTier: 6,
    baseCost: 75,
    costGrowth: 1.6,
    value: (t) => t * 7,
    format: (v) => `-${v}%`,
    category: "utility",
  },
  {
    id: "magnet",
    name: "Magnet",
    desc: "Auto-collect coins from a wider range.",
    icon: "Magnet",
    maxTier: 6,
    baseCost: 45,
    costGrowth: 1.45,
    value: (t) => t * 55,
    format: (v) => `${v}px`,
    category: "utility",
  },
];

export type UpgradeState = Record<UpgradeId, number>;

export function initialUpgradeState(): UpgradeState {
  const s = {} as UpgradeState;
  for (const u of UPGRADES) s[u.id] = 0;
  return s;
}

export function statValue(id: UpgradeId, state: UpgradeState): number {
  const u = UPGRADES.find((x) => x.id === id)!;
  return u.value(state[id]);
}
