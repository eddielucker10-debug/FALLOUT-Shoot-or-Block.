// Admin / developer cheat system.
// Gated behind a password in the UI. Toggle powers feed a Cheats object the
// engine reads every frame; action powers fire one-off callbacks.

export const ADMIN_PASSWORD = "261112";

export interface Cheats {
  // --- defense booleans ---
  godMode: boolean;
  infiniteShield: boolean;
  instantShieldCd: boolean;
  thorns: boolean;
  noVolatile: boolean;
  lifesteal: boolean;
  hyperRegen: boolean;
  autoBlock: boolean;
  reflectDamage: boolean;
  ghostArmor: boolean;
  comboLock: boolean;
  // --- offense booleans ---
  oneShot: boolean;
  alwaysCrit: boolean;
  bigCrit: boolean;
  infinitePierce: boolean;
  allExplosive: boolean;
  bigBlast: boolean;
  homing: boolean;
  chainKills: boolean;
  bounceShots: boolean;
  burnRounds: boolean;
  forceTurret: boolean;
  knockback: boolean;
  rapidFire: boolean;
  autoFire: boolean;
  // --- control booleans ---
  freezeEnemies: boolean;
  noArmor: boolean;
  maxLuck: boolean;
  magnetAll: boolean;
  // --- visual booleans ---
  rainbow: boolean;
  bigPlayer: boolean;
  tinyPlayer: boolean;
  showHitboxes: boolean;
  noHurtFlash: boolean;
  extraParticles: boolean;
  goldenShip: boolean;
  stealthShip: boolean;
  // --- numeric (computed from toggle stacks) ---
  damageMult: number;
  coinMult: number;
  scoreMult: number;
  fireRateMult: number;
  speedMult: number;
  shieldMult: number;
  hpMult: number;
  projSizeMult: number;
  multishotSet: number;
  extraSpread: number;
  gravityMult: number;
  spawnMult: number;
  waveSpeedMult: number;
  luckAdd: number;
  debrisSizeMult: number;
  enemyHpMult: number;
}

export const DEFAULT_CHEATS: Cheats = {
  godMode: false,
  infiniteShield: false,
  instantShieldCd: false,
  thorns: false,
  noVolatile: false,
  lifesteal: false,
  hyperRegen: false,
  autoBlock: false,
  reflectDamage: false,
  ghostArmor: false,
  comboLock: false,
  oneShot: false,
  alwaysCrit: false,
  bigCrit: false,
  infinitePierce: false,
  allExplosive: false,
  bigBlast: false,
  homing: false,
  chainKills: false,
  bounceShots: false,
  burnRounds: false,
  forceTurret: false,
  knockback: false,
  rapidFire: false,
  autoFire: false,
  freezeEnemies: false,
  noArmor: false,
  maxLuck: false,
  magnetAll: false,
  rainbow: false,
  bigPlayer: false,
  tinyPlayer: false,
  showHitboxes: false,
  noHurtFlash: false,
  extraParticles: false,
  goldenShip: false,
  stealthShip: false,
  damageMult: 1,
  coinMult: 1,
  scoreMult: 1,
  fireRateMult: 1,
  speedMult: 1,
  shieldMult: 1,
  hpMult: 1,
  projSizeMult: 1,
  multishotSet: 0,
  extraSpread: 0,
  gravityMult: 1,
  spawnMult: 1,
  waveSpeedMult: 1,
  luckAdd: 0,
  debrisSizeMult: 1,
  enemyHpMult: 1,
};

export type PowerGroup =
  "Offense" | "Defense" | "Multipliers" | "Control" | "Visual" | "Economy" | "Unlocks" | "Run";

export interface Power {
  id: string;
  name: string;
  desc: string;
  kind: "toggle" | "action";
  group: PowerGroup;
  /** action powers that only make sense during an active run */
  runOnly?: boolean;
}

// 80 toggle powers + 20 action powers = 100 total.
export const POWERS: Power[] = [
  // ---------------- Offense (toggles) ----------------
  {
    id: "oneShot",
    name: "One-Shot Kill",
    desc: "Every hit obliterates its target.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "alwaysCrit",
    name: "Guaranteed Crits",
    desc: "Every shot is a critical hit.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "bigCrit",
    name: "Mega Crits",
    desc: "Critical hits deal 6x instead of 3x.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "infinitePierce",
    name: "Infinite Pierce",
    desc: "Shots pass through everything.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "giantBullets",
    name: "Giant Bullets",
    desc: "Triple projectile size.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "colossalBullets",
    name: "Colossal Bullets",
    desc: "6x projectile size.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "megaMultishot",
    name: "Mega Multishot",
    desc: "Fire 30 projectiles at once.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "ultraMultishot",
    name: "Ultra Multishot",
    desc: "Fire 60 projectiles at once.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "wideSpread",
    name: "Wide Spread",
    desc: "Fan shots across 60°.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "fullSpread",
    name: "Full Arc",
    desc: "Blanket the screen across 160°.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "rapidFire",
    name: "Hyper Fire Rate",
    desc: "Fire absurdly fast.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "autoFire",
    name: "Auto-Fire",
    desc: "Shoot continuously, no input.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "allExplosive",
    name: "Explosive Everything",
    desc: "All kills detonate.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "bigBlast",
    name: "Massive Blasts",
    desc: "Explosions cover a huge radius.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "homing",
    name: "Homing Bullets",
    desc: "Projectiles chase the nearest target.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "chainKills",
    name: "Chain Reaction",
    desc: "Kills damage everything nearby.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "bounceShots",
    name: "Ricochet Rounds",
    desc: "Projectiles bounce off the walls.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "burnRounds",
    name: "Incinerate",
    desc: "Hits set targets on fire over time.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "forceTurret",
    name: "Overclocked Turret",
    desc: "Force a maxed auto-turret drone.",
    kind: "toggle",
    group: "Offense",
  },
  {
    id: "knockback",
    name: "Knockback Rounds",
    desc: "Hits shove debris back upward.",
    kind: "toggle",
    group: "Offense",
  },

  // ---------------- Defense (toggles) ----------------
  {
    id: "godMode",
    name: "God Mode",
    desc: "Take no damage at all.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "infiniteShield",
    name: "Infinite Shield",
    desc: "Shield never drains or breaks.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "instantShieldCd",
    name: "Instant Recharge",
    desc: "No shield cooldown.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "thorns",
    name: "Thorns Aura",
    desc: "Taking damage clears the screen.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "reflectDamage",
    name: "Reflect Field",
    desc: "Damage taken vaporizes all debris.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "ghostArmor",
    name: "Phase Armor",
    desc: "Reduce all incoming damage by 90%.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "noVolatile",
    name: "Defuse Volatiles",
    desc: "Volatile debris deals normal damage.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "lifesteal",
    name: "Lifesteal Rounds",
    desc: "Heal on every projectile hit.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "hyperRegen",
    name: "Hyper Regen",
    desc: "Regenerate hull very quickly.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "autoBlock",
    name: "Auto-Shield",
    desc: "Hold the shield up automatically.",
    kind: "toggle",
    group: "Defense",
  },
  {
    id: "comboLock",
    name: "Combo Lock",
    desc: "Your combo never resets.",
    kind: "toggle",
    group: "Defense",
  },

  // ---------------- Multipliers (toggles) ----------------
  {
    id: "dmgX2",
    name: "Damage x2",
    desc: "Double all damage.",
    kind: "toggle",
    group: "Multipliers",
  },
  { id: "dmgX5", name: "Damage x5", desc: "5x all damage.", kind: "toggle", group: "Multipliers" },
  {
    id: "dmgX25",
    name: "Damage x25",
    desc: "25x all damage.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "dmgX100",
    name: "Damage x100",
    desc: "100x all damage.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "dmgX1000",
    name: "Damage x1000",
    desc: "1000x all damage.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "coinX2",
    name: "Coins x2",
    desc: "Double coins earned.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "coinX5",
    name: "Coins x5",
    desc: "5x coins earned.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "coinX25",
    name: "Coins x25",
    desc: "25x coins earned.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "coinX100",
    name: "Coins x100",
    desc: "100x coins earned.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "coinX1000",
    name: "Coins x1000",
    desc: "1000x coins earned.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "scoreX2",
    name: "Score x2",
    desc: "Double score gained.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "scoreX10",
    name: "Score x10",
    desc: "10x score gained.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "scoreX100",
    name: "Score x100",
    desc: "100x score gained.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "fireRateX2",
    name: "Fire Rate x2",
    desc: "Double fire rate.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "fireRateX3",
    name: "Fire Rate x3",
    desc: "Triple fire rate.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "fireRateX5",
    name: "Fire Rate x5",
    desc: "5x fire rate.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "fireRateX10",
    name: "Fire Rate x10",
    desc: "10x fire rate.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "speedX2",
    name: "Move Speed x2",
    desc: "Double movement speed.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "speedX3",
    name: "Move Speed x3",
    desc: "Triple movement speed.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "speedX5",
    name: "Move Speed x5",
    desc: "5x movement speed.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "shieldX3",
    name: "Shield x3",
    desc: "Triple shield capacity.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "shieldX5",
    name: "Shield x5",
    desc: "5x shield capacity.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "shieldX10",
    name: "Shield x10",
    desc: "10x shield capacity.",
    kind: "toggle",
    group: "Multipliers",
  },
  {
    id: "hpX2",
    name: "Hull x2",
    desc: "Double maximum hull.",
    kind: "toggle",
    group: "Multipliers",
  },
  { id: "hpX5", name: "Hull x5", desc: "5x maximum hull.", kind: "toggle", group: "Multipliers" },
  {
    id: "hpX10",
    name: "Hull x10",
    desc: "10x maximum hull.",
    kind: "toggle",
    group: "Multipliers",
  },

  // ---------------- Control (toggles) ----------------
  {
    id: "freezeEnemies",
    name: "Freeze Enemies",
    desc: "Debris stops falling.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "lowGravity",
    name: "Low Gravity",
    desc: "Debris falls at 40% speed.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "superGravity",
    name: "Heavy Gravity",
    desc: "Debris falls at 2x speed.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "noSpawns",
    name: "Stop Spawns",
    desc: "No new debris appears.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "doubleSpawns",
    name: "Double Spawns",
    desc: "Twice the debris.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "tripleSpawns",
    name: "Triple Spawns",
    desc: "Three times the debris.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "fastWaves",
    name: "Fast Waves",
    desc: "Waves advance 3x faster.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "slowWaves",
    name: "Slow Waves",
    desc: "Waves advance 3x slower.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "maxLuck",
    name: "Max Luck",
    desc: "Force the rarest spawns.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "magnetAll",
    name: "Total Magnet",
    desc: "Pull in loot from anywhere.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "giantDebris",
    name: "Giant Debris",
    desc: "Debris renders much larger.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "tinyDebris",
    name: "Tiny Debris",
    desc: "Debris renders much smaller.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "weakEnemies",
    name: "Glass Debris",
    desc: "Debris has 10% health.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "toughEnemies",
    name: "Armored Debris",
    desc: "Debris has 5x health.",
    kind: "toggle",
    group: "Control",
  },
  {
    id: "noArmor",
    name: "Shred Armor",
    desc: "Armored debris takes full shot damage.",
    kind: "toggle",
    group: "Control",
  },

  // ---------------- Visual (toggles) ----------------
  {
    id: "rainbow",
    name: "Rainbow Mode",
    desc: "Cycle projectile colors.",
    kind: "toggle",
    group: "Visual",
  },
  {
    id: "bigPlayer",
    name: "Giant Ship",
    desc: "Render an oversized ship.",
    kind: "toggle",
    group: "Visual",
  },
  {
    id: "tinyPlayer",
    name: "Tiny Ship",
    desc: "Render a miniature ship.",
    kind: "toggle",
    group: "Visual",
  },
  {
    id: "showHitboxes",
    name: "Show Hitboxes",
    desc: "Draw debris hit circles.",
    kind: "toggle",
    group: "Visual",
  },
  {
    id: "noHurtFlash",
    name: "No Hurt Flash",
    desc: "Hide the red damage vignette.",
    kind: "toggle",
    group: "Visual",
  },
  {
    id: "extraParticles",
    name: "Particle Overdrive",
    desc: "Explosions throw extra particles.",
    kind: "toggle",
    group: "Visual",
  },
  {
    id: "goldenShip",
    name: "Golden Ship",
    desc: "Paint your ship pure gold.",
    kind: "toggle",
    group: "Visual",
  },
  {
    id: "stealthShip",
    name: "Stealth Ship",
    desc: "Render a translucent ship.",
    kind: "toggle",
    group: "Visual",
  },

  // ---------------- Economy (actions) ----------------
  {
    id: "give1m",
    name: "Give 1,000,000 Coins",
    desc: "Add one million coins.",
    kind: "action",
    group: "Economy",
  },
  {
    id: "give10m",
    name: "Give 10,000,000 Coins",
    desc: "Add ten million coins.",
    kind: "action",
    group: "Economy",
  },
  {
    id: "give100m",
    name: "Give 100,000,000 Coins",
    desc: "Add a hundred million coins.",
    kind: "action",
    group: "Economy",
  },
  {
    id: "give1b",
    name: "Give 1,000,000,000 Coins",
    desc: "Add one billion coins.",
    kind: "action",
    group: "Economy",
  },
  {
    id: "give10b",
    name: "Give 10,000,000,000 Coins",
    desc: "Add ten billion coins.",
    kind: "action",
    group: "Economy",
  },
  {
    id: "give100b",
    name: "Give 100,000,000,000 Coins",
    desc: "Add a hundred billion coins.",
    kind: "action",
    group: "Economy",
  },
  {
    id: "resetCoins",
    name: "Reset Coins",
    desc: "Set your coin balance to zero.",
    kind: "action",
    group: "Economy",
  },

  // ---------------- Unlocks (actions) ----------------
  {
    id: "unlockShips",
    name: "Unlock All Ships",
    desc: "Grant every ship skin.",
    kind: "action",
    group: "Unlocks",
  },
  {
    id: "unlockBullets",
    name: "Unlock All Bullets",
    desc: "Grant every bullet skin.",
    kind: "action",
    group: "Unlocks",
  },
  {
    id: "unlockEverything",
    name: "Unlock Everything",
    desc: "All skins + max every upgrade.",
    kind: "action",
    group: "Unlocks",
  },
  {
    id: "maxUpgrades",
    name: "Max All Upgrades",
    desc: "Set every upgrade to max tier.",
    kind: "action",
    group: "Unlocks",
  },
  {
    id: "resetUpgrades",
    name: "Reset All Upgrades",
    desc: "Clear every upgrade.",
    kind: "action",
    group: "Unlocks",
  },

  // ---------------- Run (actions, in-run only) ----------------
  {
    id: "fullHeal",
    name: "Full Heal",
    desc: "Restore hull to maximum.",
    kind: "action",
    group: "Run",
    runOnly: true,
  },
  {
    id: "fullShield",
    name: "Full Shield",
    desc: "Restore shield to maximum.",
    kind: "action",
    group: "Run",
    runOnly: true,
  },
  {
    id: "clearScreen",
    name: "Clear Screen",
    desc: "Vaporize all debris right now.",
    kind: "action",
    group: "Run",
    runOnly: true,
  },
  {
    id: "nextWave",
    name: "Skip Wave",
    desc: "Jump to the next wave.",
    kind: "action",
    group: "Run",
    runOnly: true,
  },
  {
    id: "skip5Waves",
    name: "Skip 5 Waves",
    desc: "Jump ahead five waves.",
    kind: "action",
    group: "Run",
    runOnly: true,
  },
  {
    id: "maxCombo",
    name: "Max Combo",
    desc: "Slam your combo to the cap.",
    kind: "action",
    group: "Run",
    runOnly: true,
  },
  {
    id: "endRun",
    name: "End Run",
    desc: "Instantly end the current run.",
    kind: "action",
    group: "Run",
    runOnly: true,
  },

  // ---------------- Meta (action) ----------------
  {
    id: "resetSave",
    name: "Wipe Save",
    desc: "Erase all saved progress.",
    kind: "action",
    group: "Unlocks",
  },
];

export const TOGGLE_POWERS = POWERS.filter((p) => p.kind === "toggle");
export const ACTION_POWERS = POWERS.filter((p) => p.kind === "action");

export const POWER_GROUPS: PowerGroup[] = [
  "Offense",
  "Defense",
  "Multipliers",
  "Control",
  "Visual",
  "Economy",
  "Unlocks",
  "Run",
];

export type PowerToggles = Record<string, boolean>;

const stack = (...pairs: Array<[boolean | undefined, number]>): number =>
  pairs.reduce((acc, [on, mult]) => (on ? acc * mult : acc), 1);

export function cheatsFromToggles(t: PowerToggles): Cheats {
  return {
    godMode: !!t["godMode"],
    infiniteShield: !!t["infiniteShield"],
    instantShieldCd: !!t["instantShieldCd"],
    thorns: !!t["thorns"],
    noVolatile: !!t["noVolatile"],
    lifesteal: !!t["lifesteal"],
    hyperRegen: !!t["hyperRegen"],
    autoBlock: !!t["autoBlock"],
    reflectDamage: !!t["reflectDamage"],
    ghostArmor: !!t["ghostArmor"],
    comboLock: !!t["comboLock"],
    oneShot: !!t["oneShot"],
    alwaysCrit: !!t["alwaysCrit"],
    bigCrit: !!t["bigCrit"],
    infinitePierce: !!t["infinitePierce"],
    allExplosive: !!t["allExplosive"],
    bigBlast: !!t["bigBlast"],
    homing: !!t["homing"],
    chainKills: !!t["chainKills"],
    bounceShots: !!t["bounceShots"],
    burnRounds: !!t["burnRounds"],
    forceTurret: !!t["forceTurret"],
    knockback: !!t["knockback"],
    rapidFire: !!t["rapidFire"],
    autoFire: !!t["autoFire"],
    freezeEnemies: !!t["freezeEnemies"],
    noArmor: !!t["noArmor"],
    maxLuck: !!t["maxLuck"],
    magnetAll: !!t["magnetAll"],
    rainbow: !!t["rainbow"],
    bigPlayer: !!t["bigPlayer"],
    tinyPlayer: !!t["tinyPlayer"],
    showHitboxes: !!t["showHitboxes"],
    noHurtFlash: !!t["noHurtFlash"],
    extraParticles: !!t["extraParticles"],
    goldenShip: !!t["goldenShip"],
    stealthShip: !!t["stealthShip"],
    damageMult: stack(
      [t["dmgX2"], 2],
      [t["dmgX5"], 5],
      [t["dmgX25"], 25],
      [t["dmgX100"], 100],
      [t["dmgX1000"], 1000],
    ),
    coinMult: stack(
      [t["coinX2"], 2],
      [t["coinX5"], 5],
      [t["coinX25"], 25],
      [t["coinX100"], 100],
      [t["coinX1000"], 1000],
    ),
    scoreMult: stack([t["scoreX2"], 2], [t["scoreX10"], 10], [t["scoreX100"], 100]),
    fireRateMult: stack(
      [t["fireRateX2"], 2],
      [t["fireRateX3"], 3],
      [t["fireRateX5"], 5],
      [t["fireRateX10"], 10],
    ),
    speedMult: stack([t["speedX2"], 2], [t["speedX3"], 3], [t["speedX5"], 5]),
    shieldMult: stack([t["shieldX3"], 3], [t["shieldX5"], 5], [t["shieldX10"], 10]),
    hpMult: stack([t["hpX2"], 2], [t["hpX5"], 5], [t["hpX10"], 10]),
    projSizeMult: t["colossalBullets"] ? 6 : t["giantBullets"] ? 3 : 1,
    multishotSet: t["ultraMultishot"] ? 60 : t["megaMultishot"] ? 30 : 0,
    extraSpread: t["fullSpread"] ? 160 : t["wideSpread"] ? 60 : 0,
    gravityMult: t["freezeEnemies"] ? 0 : t["superGravity"] ? 2 : t["lowGravity"] ? 0.4 : 1,
    spawnMult: t["noSpawns"] ? 0 : t["tripleSpawns"] ? 3 : t["doubleSpawns"] ? 2 : 1,
    waveSpeedMult: t["fastWaves"] ? 3 : t["slowWaves"] ? 0.3 : 1,
    luckAdd: t["maxLuck"] ? 999 : 0,
    debrisSizeMult: t["giantDebris"] ? 1.6 : t["tinyDebris"] ? 0.5 : 1,
    enemyHpMult: t["toughEnemies"] ? 5 : t["weakEnemies"] ? 0.1 : 1,
  };
}
