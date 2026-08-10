export interface Skin {
  id: string;
  name: string;
  /** coin cost to unlock (0 = free / owned by default) */
  cost: number;
  /** main hull fill color */
  body: string;
  /** glow / shadow color */
  glow: string;
  /** cockpit color */
  cockpit: string;
  /** thruster flame color */
  thruster: string;
}

/** The default ship — always owned, free. */
export const DEFAULT_SKIN: Skin = {
  id: "standard",
  name: "Standard Issue",
  cost: 0,
  body: "#c4b5fd",
  glow: "#a78bfa",
  cockpit: "#7c3aed",
  thruster: "#67e8f9",
};

// 20 unlockable skins. Prices start at 100,000 and climb by 50,000 each.
const SKIN_DEFS: Omit<Skin, "cost">[] = [
  {
    id: "ember",
    name: "Ember",
    body: "#fdba74",
    glow: "#f97316",
    cockpit: "#c2410c",
    thruster: "#fef08a",
  },
  {
    id: "toxic",
    name: "Toxic Bloom",
    body: "#bef264",
    glow: "#84cc16",
    cockpit: "#4d7c0f",
    thruster: "#ecfccb",
  },
  {
    id: "frostbite",
    name: "Frostbite",
    body: "#bae6fd",
    glow: "#38bdf8",
    cockpit: "#0369a1",
    thruster: "#e0f2fe",
  },
  {
    id: "voidwalker",
    name: "Voidwalker",
    body: "#c4b5fd",
    glow: "#7c3aed",
    cockpit: "#4c1d95",
    thruster: "#ddd6fe",
  },
  {
    id: "bloodmoon",
    name: "Blood Moon",
    body: "#fca5a5",
    glow: "#ef4444",
    cockpit: "#991b1b",
    thruster: "#fecaca",
  },
  {
    id: "goldrush",
    name: "Gold Rush",
    body: "#fde68a",
    glow: "#f59e0b",
    cockpit: "#b45309",
    thruster: "#fffbeb",
  },
  {
    id: "neonpulse",
    name: "Neon Pulse",
    body: "#f0abfc",
    glow: "#d946ef",
    cockpit: "#a21caf",
    thruster: "#fae8ff",
  },
  {
    id: "deepsea",
    name: "Deep Sea",
    body: "#5eead4",
    glow: "#14b8a6",
    cockpit: "#0f766e",
    thruster: "#ccfbf1",
  },
  {
    id: "sunburst",
    name: "Sunburst",
    body: "#fcd34d",
    glow: "#f97316",
    cockpit: "#ea580c",
    thruster: "#fef9c3",
  },
  {
    id: "amethyst",
    name: "Amethyst",
    body: "#d8b4fe",
    glow: "#a855f7",
    cockpit: "#6b21a8",
    thruster: "#f3e8ff",
  },
  {
    id: "chrome",
    name: "Chrome",
    body: "#e2e8f0",
    glow: "#94a3b8",
    cockpit: "#475569",
    thruster: "#f8fafc",
  },
  {
    id: "inferno",
    name: "Inferno",
    body: "#fca5a5",
    glow: "#f97316",
    cockpit: "#7f1d1d",
    thruster: "#fde047",
  },
  {
    id: "aurora",
    name: "Aurora",
    body: "#6ee7b7",
    glow: "#22d3ee",
    cockpit: "#0e7490",
    thruster: "#a7f3d0",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    body: "#93c5fd",
    glow: "#2563eb",
    cockpit: "#1e3a8a",
    thruster: "#dbeafe",
  },
  {
    id: "rosequartz",
    name: "Rose Quartz",
    body: "#fbcfe8",
    glow: "#ec4899",
    cockpit: "#9d174d",
    thruster: "#fce7f3",
  },
  {
    id: "emerald",
    name: "Emerald",
    body: "#6ee7b7",
    glow: "#10b981",
    cockpit: "#065f46",
    thruster: "#d1fae5",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    body: "#64748b",
    glow: "#22d3ee",
    cockpit: "#0f172a",
    thruster: "#67e8f9",
  },
  {
    id: "plasma",
    name: "Plasma",
    body: "#a5f3fc",
    glow: "#06b6d4",
    cockpit: "#155e75",
    thruster: "#ffffff",
  },
  {
    id: "solarflare",
    name: "Solar Flare",
    body: "#fed7aa",
    glow: "#fb923c",
    cockpit: "#9a3412",
    thruster: "#fef08a",
  },
  {
    id: "singularity",
    name: "Singularity",
    body: "#e9d5ff",
    glow: "#f472b6",
    cockpit: "#1e1b4b",
    thruster: "#f0abfc",
  },
];

export const SKINS: Skin[] = [
  DEFAULT_SKIN,
  ...SKIN_DEFS.map((s, i) => ({ ...s, cost: 100000 + i * 50000 })),
];

export function getSkin(id: string): Skin {
  return SKINS.find((s) => s.id === id) ?? DEFAULT_SKIN;
}

// ---- Bullet skins ----

export interface BulletSkin {
  id: string;
  name: string;
  /** coin cost to unlock (0 = free / owned by default) */
  cost: number;
  /** projectile core fill color */
  core: string;
  /** glow / shadow color */
  glow: string;
  /** color used when the shot is a critical hit */
  crit: string;
  /** rendered projectile silhouette */
  shape: BulletShape;
  /** trailing afterimage style */
  trail: BulletTrail;
}

export type BulletShape =
  "bolt" | "orb" | "diamond" | "star" | "beam" | "ring" | "arrow" | "spark" | "cross" | "blade";

export type BulletTrail = "none" | "streak" | "comet" | "sparks" | "smoke";

/** The default tracer — always owned, free. */
export const DEFAULT_BULLET_SKIN: BulletSkin = {
  id: "tracer",
  name: "Standard Tracer",
  cost: 0,
  core: "#a5f3fc",
  glow: "#67e8f9",
  crit: "#fecdd3",
  shape: "bolt",
  trail: "none",
};

// 39 unlockable bullet skins. Prices start at 75,000 and climb by 45,000 each.
const BULLET_DEFS: Omit<BulletSkin, "cost">[] = [
  {
    id: "b-plasma",
    name: "Plasma Bolt",
    core: "#f0abfc",
    glow: "#d946ef",
    crit: "#fae8ff",
    shape: "bolt",
    trail: "streak",
  },
  {
    id: "b-ember",
    name: "Ember Round",
    core: "#fdba74",
    glow: "#f97316",
    crit: "#fef08a",
    shape: "orb",
    trail: "comet",
  },
  {
    id: "b-toxic",
    name: "Toxic Dart",
    core: "#bef264",
    glow: "#84cc16",
    crit: "#ecfccb",
    shape: "arrow",
    trail: "smoke",
  },
  {
    id: "b-frost",
    name: "Frost Shard",
    core: "#bae6fd",
    glow: "#38bdf8",
    crit: "#e0f2fe",
    shape: "diamond",
    trail: "sparks",
  },
  {
    id: "b-blood",
    name: "Blood Tracer",
    core: "#fca5a5",
    glow: "#ef4444",
    crit: "#fecaca",
    shape: "bolt",
    trail: "comet",
  },
  {
    id: "b-gold",
    name: "Golden Slug",
    core: "#fde68a",
    glow: "#f59e0b",
    crit: "#fffbeb",
    shape: "orb",
    trail: "sparks",
  },
  {
    id: "b-void",
    name: "Void Lance",
    core: "#c4b5fd",
    glow: "#7c3aed",
    crit: "#ddd6fe",
    shape: "beam",
    trail: "streak",
  },
  {
    id: "b-aqua",
    name: "Aqua Pulse",
    core: "#5eead4",
    glow: "#14b8a6",
    crit: "#ccfbf1",
    shape: "ring",
    trail: "none",
  },
  {
    id: "b-rose",
    name: "Rose Beam",
    core: "#fbcfe8",
    glow: "#ec4899",
    crit: "#fce7f3",
    shape: "beam",
    trail: "comet",
  },
  {
    id: "b-emerald",
    name: "Emerald Ray",
    core: "#6ee7b7",
    glow: "#10b981",
    crit: "#d1fae5",
    shape: "blade",
    trail: "streak",
  },
  {
    id: "b-cobalt",
    name: "Cobalt Streak",
    core: "#93c5fd",
    glow: "#2563eb",
    crit: "#dbeafe",
    shape: "bolt",
    trail: "streak",
  },
  {
    id: "b-solar",
    name: "Solar Flare",
    core: "#fed7aa",
    glow: "#fb923c",
    crit: "#fef08a",
    shape: "star",
    trail: "sparks",
  },
  {
    id: "b-chrome",
    name: "Chrome Slug",
    core: "#e2e8f0",
    glow: "#94a3b8",
    crit: "#f8fafc",
    shape: "orb",
    trail: "none",
  },
  {
    id: "b-neon",
    name: "Neon Bolt",
    core: "#a5f3fc",
    glow: "#06b6d4",
    crit: "#ffffff",
    shape: "bolt",
    trail: "sparks",
  },
  {
    id: "b-singularity",
    name: "Singularity Shot",
    core: "#e9d5ff",
    glow: "#f472b6",
    crit: "#f0abfc",
    shape: "ring",
    trail: "comet",
  },
  {
    id: "b-nova",
    name: "Nova Burst",
    core: "#fff7ed",
    glow: "#fb7185",
    crit: "#ffe4e6",
    shape: "star",
    trail: "comet",
  },
  {
    id: "b-hex",
    name: "Hex Charge",
    core: "#d9f99d",
    glow: "#65a30d",
    crit: "#f7fee7",
    shape: "diamond",
    trail: "streak",
  },
  {
    id: "b-railgun",
    name: "Railgun Slug",
    core: "#e0f2fe",
    glow: "#0ea5e9",
    crit: "#ffffff",
    shape: "beam",
    trail: "streak",
  },
  {
    id: "b-obsidian",
    name: "Obsidian Fang",
    core: "#94a3b8",
    glow: "#22d3ee",
    crit: "#cffafe",
    shape: "blade",
    trail: "smoke",
  },
  {
    id: "b-magma",
    name: "Magma Core",
    core: "#f97316",
    glow: "#dc2626",
    crit: "#fde047",
    shape: "orb",
    trail: "comet",
  },
  {
    id: "b-glacier",
    name: "Glacier Spike",
    core: "#e0f2fe",
    glow: "#60a5fa",
    crit: "#ffffff",
    shape: "arrow",
    trail: "sparks",
  },
  {
    id: "b-phantom",
    name: "Phantom Wisp",
    core: "#ddd6fe",
    glow: "#8b5cf6",
    crit: "#f5f3ff",
    shape: "spark",
    trail: "smoke",
  },
  {
    id: "b-radiant",
    name: "Radiant Cross",
    core: "#fef9c3",
    glow: "#facc15",
    crit: "#ffffff",
    shape: "cross",
    trail: "sparks",
  },
  {
    id: "b-abyss",
    name: "Abyssal Eye",
    core: "#38bdf8",
    glow: "#1e1b4b",
    crit: "#a5f3fc",
    shape: "ring",
    trail: "smoke",
  },
  {
    id: "b-venom",
    name: "Venom Spitter",
    core: "#a3e635",
    glow: "#4d7c0f",
    crit: "#ecfccb",
    shape: "spark",
    trail: "smoke",
  },
  {
    id: "b-quantum",
    name: "Quantum Split",
    core: "#c7d2fe",
    glow: "#6366f1",
    crit: "#eef2ff",
    shape: "cross",
    trail: "streak",
  },
  {
    id: "b-inferno",
    name: "Inferno Lance",
    core: "#fdba74",
    glow: "#b91c1c",
    crit: "#fef08a",
    shape: "beam",
    trail: "comet",
  },
  {
    id: "b-arcane",
    name: "Arcane Sigil",
    core: "#f5d0fe",
    glow: "#a21caf",
    crit: "#fdf4ff",
    shape: "star",
    trail: "streak",
  },
  {
    id: "b-tempest",
    name: "Tempest Coil",
    core: "#a5b4fc",
    glow: "#4338ca",
    crit: "#e0e7ff",
    shape: "spark",
    trail: "sparks",
  },
  {
    id: "b-mercury",
    name: "Mercury Drop",
    core: "#f1f5f9",
    glow: "#64748b",
    crit: "#ffffff",
    shape: "orb",
    trail: "streak",
  },
  {
    id: "b-sakura",
    name: "Sakura Petal",
    core: "#fecdd3",
    glow: "#f472b6",
    crit: "#fff1f2",
    shape: "diamond",
    trail: "sparks",
  },
  {
    id: "b-jade",
    name: "Jade Kunai",
    core: "#a7f3d0",
    glow: "#047857",
    crit: "#ecfdf5",
    shape: "arrow",
    trail: "streak",
  },
  {
    id: "b-eclipse",
    name: "Eclipse Ring",
    core: "#fbbf24",
    glow: "#171717",
    crit: "#fef3c7",
    shape: "ring",
    trail: "smoke",
  },
  {
    id: "b-prism",
    name: "Prism Cutter",
    core: "#bae6fd",
    glow: "#c084fc",
    crit: "#ffffff",
    shape: "blade",
    trail: "sparks",
  },
  {
    id: "b-thunder",
    name: "Thunder Fang",
    core: "#fef08a",
    glow: "#eab308",
    crit: "#fffbeb",
    shape: "blade",
    trail: "streak",
  },
  {
    id: "b-nebula",
    name: "Nebula Mote",
    core: "#f0abfc",
    glow: "#6366f1",
    crit: "#fae8ff",
    shape: "spark",
    trail: "comet",
  },
  {
    id: "b-titan",
    name: "Titan Breaker",
    core: "#fdba74",
    glow: "#78350f",
    crit: "#fef3c7",
    shape: "cross",
    trail: "smoke",
  },
  {
    id: "b-zenith",
    name: "Zenith Star",
    core: "#ffffff",
    glow: "#22d3ee",
    crit: "#a5f3fc",
    shape: "star",
    trail: "comet",
  },
  {
    id: "b-omega",
    name: "Omega Protocol",
    core: "#fca5a5",
    glow: "#f43f5e",
    crit: "#ffffff",
    shape: "cross",
    trail: "comet",
  },
];

export const BULLET_SKINS: BulletSkin[] = [
  DEFAULT_BULLET_SKIN,
  ...BULLET_DEFS.map((s, i) => ({ ...s, cost: 75000 + i * 45000 })),
];

export function getBulletSkin(id: string): BulletSkin {
  return BULLET_SKINS.find((s) => s.id === id) ?? DEFAULT_BULLET_SKIN;
}
