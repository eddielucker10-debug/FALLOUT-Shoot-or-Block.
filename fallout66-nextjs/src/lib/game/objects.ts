export type Shape =
  "circle" | "diamond" | "square" | "triangle" | "hex" | "star" | "pentagon" | "cross";

/** How the object is best dealt with. */
export type Preferred = "shoot" | "block" | "any";

export interface FallingType {
  id: number;
  name: string;
  shape: Shape;
  /** base hit points before rarity multiplier */
  hp: number;
  /** base fall speed (px/sec) before difficulty scaling */
  speed: number;
  /** base radius in px */
  size: number;
  /** base coin reward before rarity multiplier */
  coins: number;
  /** best way to handle it */
  preferred: Preferred;
  /** splits into 2 smaller copies when destroyed */
  splits?: boolean | undefined;
  /** deals extra damage if it reaches the player */
  volatile?: boolean | undefined;
  /** short flavor description */
  desc: string;
}

// Handcrafted name pool grouped loosely by "family".
// 100 unique falling things to shoot or block.
const NAMES: [string, Shape, Preferred, string][] = [
  ["Pebble", "circle", "shoot", "A tiny space rock. Harmless in bulk, deadly in swarms."],
  ["Ice Shard", "diamond", "shoot", "Brittle frozen splinter."],
  ["Scrap Bolt", "square", "any", "Loose bolt from a wrecked ship."],
  ["Ember", "circle", "shoot", "A glowing cinder that flickers as it falls."],
  ["Dust Mote", "circle", "shoot", "Barely worth a shot."],
  ["Rusty Cog", "hex", "block", "Heavy and armored — better to block."],
  ["Glass Sliver", "triangle", "shoot", "Shatters on contact."],
  ["Copper Node", "hex", "any", "A conductive lump of ore."],
  ["Spore Pod", "circle", "shoot", "Bursts into smaller spores."],
  ["Bone Chip", "triangle", "shoot", "Fragment of something long dead."],
  ["Iron Plate", "square", "block", "A slab of hull plating."],
  ["Crystal Bit", "diamond", "shoot", "Refracts light beautifully."],
  ["Ash Clump", "circle", "shoot", "Smoldering debris."],
  ["Gear Tooth", "triangle", "block", "Jagged and sturdy."],
  ["Slime Blob", "circle", "shoot", "Wobbles as it drops."],
  ["Magma Drop", "circle", "block", "Molten and volatile."],
  ["Void Pebble", "circle", "shoot", "Cold to the touch."],
  ["Steel Nut", "hex", "block", "Small but dense."],
  ["Sand Grain", "circle", "shoot", "One of a million."],
  ["Coal Lump", "pentagon", "shoot", "Sooty and cheap."],
  ["Amber Bead", "circle", "shoot", "Ancient resin, faintly glowing."],
  ["Frost Spike", "diamond", "shoot", "Sharp and freezing."],
  ["Bronze Disc", "circle", "block", "An old, worn coin of some empire."],
  ["Quartz Chunk", "hex", "any", "Semi-precious rubble."],
  ["Meteor Frag", "pentagon", "block", "Screaming in from orbit."],
  ["Toxic Cell", "circle", "shoot", "Splits and spreads."],
  ["Rune Stone", "square", "any", "Etched with faded glyphs."],
  ["Plasma Wisp", "star", "shoot", "Unstable energy."],
  ["Cinder Ball", "circle", "shoot", "Rolling flame."],
  ["Titanium Bar", "square", "block", "Nearly indestructible."],
  ["Comet Ice", "diamond", "shoot", "Trailing vapor."],
  ["Nickel Ore", "hex", "any", "Faintly magnetic."],
  ["Fungal Cap", "circle", "shoot", "Releases spores when hit."],
  ["Obsidian Edge", "triangle", "block", "Razor-sharp volcanic glass."],
  ["Storm Cell", "circle", "shoot", "Crackling with static."],
  ["Gold Nugget", "pentagon", "any", "Worth a small fortune."],
  ["Cursed Coin", "circle", "block", "Handle with care."],
  ["Nova Shard", "star", "shoot", "A splinter of a dying star."],
  ["Basalt Rock", "hex", "block", "Dense volcanic stone."],
  ["Ectoplasm", "circle", "shoot", "Semi-transparent goo."],
  ["Alloy Cube", "square", "block", "Engineered to endure."],
  ["Prism Core", "diamond", "shoot", "Splits light into color."],
  ["Volt Node", "hex", "any", "Overcharged battery cell."],
  ["Wraith Fragment", "star", "shoot", "Whispers as it descends."],
  ["Marble Sphere", "circle", "any", "Polished and heavy."],
  ["Cryo Pod", "diamond", "block", "Frozen containment shell."],
  ["Sulfur Nodule", "circle", "shoot", "Reeks of rotten eggs."],
  ["Chrome Ball", "circle", "any", "Mirror-bright."],
  ["Dread Orb", "circle", "block", "Radiates unease."],
  ["Star Fragment", "star", "shoot", "Twinkles faintly."],
  ["Granite Slab", "square", "block", "Solid as a mountain."],
  ["Mana Crystal", "diamond", "shoot", "Hums with power."],
  ["Cobalt Ore", "hex", "any", "A brilliant blue metal."],
  ["Phantom Cell", "circle", "shoot", "Flickers in and out."],
  ["Diamond Chip", "diamond", "shoot", "Hard, small, valuable."],
  ["Lead Ingot", "square", "block", "Heavy and toxic."],
  ["Radiant Mote", "star", "shoot", "Softly luminous."],
  ["Slate Tile", "square", "block", "Flat and stubborn."],
  ["Venom Sac", "circle", "shoot", "Ruptures into droplets."],
  ["Silver Bead", "circle", "any", "Cool and gleaming."],
  ["Abyss Stone", "pentagon", "block", "Darker than the void."],
  ["Solar Shard", "diamond", "shoot", "Warm to the touch."],
  ["Tungsten Bolt", "hex", "block", "Extreme melting point."],
  ["Ghost Ember", "circle", "shoot", "A flame with no heat."],
  ["Ruby Fragment", "triangle", "shoot", "Deep crimson glint."],
  ["Ceramic Plate", "square", "block", "Fractures under fire."],
  ["Ion Cluster", "star", "shoot", "Charged particles clumped."],
  ["Onyx Bead", "circle", "any", "Glossy black stone."],
  ["Terror Orb", "circle", "block", "Pulses ominously."],
  ["Emerald Chip", "diamond", "shoot", "Vivid green facets."],
  ["Adamant Cube", "square", "block", "The hardest known alloy."],
  ["Fae Light", "star", "shoot", "Darts unpredictably."],
  ["Pumice Ball", "circle", "shoot", "Full of holes, light as air."],
  ["Sapphire Bit", "diamond", "shoot", "Cool blue brilliance."],
  ["Warden Plate", "square", "block", "Guardian armor scrap."],
  ["Hex Bolt", "hex", "any", "Six-sided fastener."],
  ["Soul Fragment", "star", "shoot", "Faintly warm and alive."],
  ["Meteor Core", "pentagon", "block", "The dense heart of a rock."],
  ["Neon Cell", "circle", "shoot", "Glows electric pink."],
  ["Topaz Chip", "triangle", "shoot", "Golden and bright."],
  ["Bulwark Slab", "square", "block", "A wall unto itself."],
  ["Quantum Bit", "diamond", "shoot", "Here and not here."],
  ["Cryst Node", "hex", "any", "Growing crystalline mass."],
  ["Star Core", "star", "block", "A collapsed stellar remnant."],
  ["Amethyst Chip", "diamond", "shoot", "Regal purple sparkle."],
  ["Titan Plate", "square", "block", "Forged for giants."],
  ["Flux Orb", "circle", "shoot", "Shifting energy state."],
  ["Garnet Bit", "triangle", "shoot", "Deep wine-red."],
  ["Aegis Cube", "square", "block", "Impact-hardened shell."],
  ["Nebula Mote", "star", "shoot", "A pinch of a galaxy."],
  ["Pyrite Chunk", "hex", "any", "Fool's gold, still shiny."],
  ["Doom Sphere", "circle", "block", "You feel it before you see it."],
  ["Opal Shard", "diamond", "shoot", "Shimmers every color."],
  ["Colossus Slab", "square", "block", "Massive beyond reason."],
  ["Pulse Star", "star", "shoot", "Beats like a heart."],
  ["Halo Ring", "circle", "block", "A ring of pure light."],
  ["Eclipse Orb", "circle", "block", "Swallows the light around it."],
  ["Prime Crystal", "diamond", "shoot", "Flawless and rare."],
  ["Genesis Core", "star", "block", "Said to hold a spark of creation."],
  ["Singularity", "circle", "block", "Do not let it reach you."],
];

/**
 * The full catalog of 100 falling things.
 * Stats scale up as the index climbs so higher-index items feel heftier.
 */
export const FALLING_TYPES: FallingType[] = NAMES.map(([name, shape, preferred, desc], i) => {
  const t = i / (NAMES.length - 1); // 0..1 progression
  const hp = Math.round(1 + t * 11 + (i % 3)); // 1..~14
  const speed = Math.round(60 + t * 90 + ((i % 5) - 2) * 6); // ~55..150
  const size = Math.round(14 + t * 16 + (i % 4) * 2); // 14..~36
  const coins = Math.round(1 + t * 9 + (i % 4)); // 1..~13
  const splits = /spore|toxic|slime|fungal|venom|cell|blob|cluster/i.test(name);
  const volatile =
    preferred === "block" &&
    /magma|doom|singularity|eclipse|terror|dread|cursed|core|meteor/i.test(name);
  return {
    id: i,
    name,
    shape,
    hp,
    speed,
    size,
    coins,
    preferred,
    splits: splits || undefined,
    volatile: volatile || undefined,
    desc,
  };
});

export const TOTAL_TYPES = FALLING_TYPES.length;
