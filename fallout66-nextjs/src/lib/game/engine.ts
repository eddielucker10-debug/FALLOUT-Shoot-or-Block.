import { DEFAULT_CHEATS, type Cheats } from "./admin";
import { FALLING_TYPES, type FallingType, type Shape } from "./objects";
import { RARITIES, RARITY_ORDER, rollRarity, type RarityId } from "./rarities";
import { DEFAULT_BULLET_SKIN, DEFAULT_SKIN, type BulletSkin, type Skin } from "./skins";
import { initialUpgradeState, statValue, type UpgradeState } from "./upgrades";

export interface GameStats {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldReady: boolean;
  blocking: boolean;
  coins: number;
  score: number;
  wave: number;
  combo: number;
  discovered: number;
  waveProgress: number;
  running: boolean;
}

interface Faller {
  x: number;
  y: number;
  vy: number;
  vx: number;
  hp: number;
  maxHp: number;
  size: number;
  type: FallingType;
  rarity: RarityId;
  coins: number;
  spin: number;
  spinSpeed: number;
  hitFlash: number;
  burn: number;
}

interface Projectile {
  x: number;
  y: number;
  vy: number;
  vx: number;
  dmg: number;
  size: number;
  pierce: number;
  hitIds: Set<Faller>;
  crit: boolean;
  homing: boolean;
  bounce: boolean;
  burn: boolean;
  knockback: boolean;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Popup {
  x: number;
  y: number;
  life: number;
  text: string;
  color: string;
}

interface Star {
  x: number;
  y: number;
  z: number;
}

const BASE_OFFSET = 46; // player line from bottom
const SHIELD_OFFSET = 96; // shield barrier from bottom

// Global coin scarcity — everything you salvage is worth a fraction of its
// raw value, so coins are hard-earned and skins take real grinding.
const COIN_RATE = 0.28;

/** shortest signed difference between two angles, in radians */
function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  W = 0;
  H = 0;
  dpr = 1;

  private raf = 0;
  private last = 0;
  running = false;

  // input
  input = { targetX: 0, moving: false, shoot: false, block: false };

  // world
  private fallers: Faller[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private stars: Star[] = [];
  private discovered = new Set<number>();

  // player
  private px = 0;
  private hp = 100;
  private maxHp = 100;
  private shield = 60;
  private maxShield = 60;
  private shieldBroken = false;
  private shieldCdTimer = 0;
  private fireTimer = 0;
  private turretTimer = 0;
  private hurtFlash = 0;

  // meta
  coins = 0;
  private score = 0;
  private wave = 1;
  private waveTimer = 0;
  private waveDuration = 22;
  private spawnTimer = 0;
  private combo = 0;
  private comboTimer = 0;

  private upgrades: UpgradeState = initialUpgradeState();
  private cheats: Cheats = DEFAULT_CHEATS;
  private rainbowHue = 0;
  private skin: Skin = DEFAULT_SKIN;
  private bulletSkin: BulletSkin = DEFAULT_BULLET_SKIN;
  private onStats: (s: GameStats) => void;
  private onGameOver: () => void;
  private statsAccum = 0;

  constructor(canvas: HTMLCanvasElement, onStats: (s: GameStats) => void, onGameOver: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.onStats = onStats;
    this.onGameOver = onGameOver;
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = rect.width;
    this.H = rect.height;
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.px === 0) this.px = this.W / 2;
    if (this.stars.length === 0) this.initStars();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        z: Math.random() * 0.8 + 0.2,
      });
    }
  }

  setSkin(skin: Skin) {
    this.skin = skin;
  }

  setBulletSkin(skin: BulletSkin) {
    this.bulletSkin = skin;
  }

  setUpgrades(state: UpgradeState) {
    this.upgrades = state;
    this.recomputeCaps();
  }

  setCheats(c: Cheats) {
    this.cheats = c;
    this.recomputeCaps();
    // infinite shield tops the bar off immediately
    if (c.infiniteShield) {
      this.shieldBroken = false;
      this.shield = this.maxShield;
    }
  }

  /** recompute hull/shield caps from upgrades × cheat multipliers */
  private recomputeCaps() {
    const newMax = statValue("maxHealth", this.upgrades) * this.cheats.hpMult;
    const extra = newMax - this.maxHp;
    this.maxHp = newMax;
    if (extra > 0) this.hp = Math.min(this.maxHp, this.hp + extra);
    this.maxShield = statValue("shieldPower", this.upgrades) * this.cheats.shieldMult;
    if (this.shield > this.maxShield) this.shield = this.maxShield;
  }

  // ---- admin run actions ----
  adminFullHeal() {
    this.hp = this.maxHp;
  }
  adminFullShield() {
    this.shieldBroken = false;
    this.shieldCdTimer = 0;
    this.shield = this.maxShield;
  }
  adminClearScreen() {
    for (const f of [...this.fallers]) this.killFaller(f, "shoot");
  }
  adminNextWave(count = 1) {
    for (let i = 0; i < count; i++) {
      this.wave++;
      this.waveTimer = 0;
    }
    this.popups.push({
      x: this.W / 2,
      y: this.H / 2,
      life: 1.6,
      text: `WAVE ${this.wave}`,
      color: "#fbbf24",
    });
  }
  adminMaxCombo() {
    this.combo = 30;
    this.comboTimer = 999;
  }
  adminEndRun() {
    this.hp = 0;
    this.gameOver();
  }

  reset() {
    this.fallers = [];
    this.projectiles = [];
    this.particles = [];
    this.popups = [];
    this.px = this.W / 2;
    this.maxHp = statValue("maxHealth", this.upgrades) * this.cheats.hpMult;
    this.hp = this.maxHp;
    this.maxShield = statValue("shieldPower", this.upgrades) * this.cheats.shieldMult;
    this.shield = this.maxShield;
    this.shieldBroken = false;
    this.shieldCdTimer = 0;
    this.coins = 0;
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.hurtFlash = 0;
    this.input.shoot = false;
    this.input.block = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.pause();
  }

  private loop = (now: number) => {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.05) dt = 0.05; // clamp big frame gaps
    this.update(dt);
    this.render();
    this.statsAccum += dt;
    if (this.statsAccum > 0.08) {
      this.statsAccum = 0;
      this.emitStats();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private emitStats() {
    this.onStats({
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: Math.round(this.maxHp),
      shield: Math.max(0, Math.round(this.shield)),
      maxShield: Math.round(this.maxShield),
      shieldReady: !this.shieldBroken,
      blocking: this.input.block && !this.shieldBroken && this.shield > 0,
      coins: Math.floor(this.coins),
      score: Math.floor(this.score),
      wave: this.wave,
      combo: this.combo,
      discovered: this.discovered.size,
      waveProgress: this.waveTimer / this.waveDuration,
      running: this.running,
    });
  }

  getStats(): GameStats {
    return {
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: Math.round(this.maxHp),
      shield: Math.max(0, Math.round(this.shield)),
      maxShield: Math.round(this.maxShield),
      shieldReady: !this.shieldBroken,
      blocking: this.input.block && !this.shieldBroken && this.shield > 0,
      coins: Math.floor(this.coins),
      score: Math.floor(this.score),
      wave: this.wave,
      combo: this.combo,
      discovered: this.discovered.size,
      waveProgress: this.waveTimer / this.waveDuration,
      running: this.running,
    };
  }

  // ---- update ----
  private update(dt: number) {
    const c = this.cheats;
    this.rainbowHue = (this.rainbowHue + dt * 240) % 360;
    const moveSpeed = statValue("moveSpeed", this.upgrades) * c.speedMult;
    // move player toward target
    const dx = this.input.targetX - this.px;
    const maxStep = moveSpeed * dt;
    if (Math.abs(dx) <= maxStep) this.px = this.input.targetX;
    else this.px += Math.sign(dx) * maxStep;
    this.px = Math.max(24, Math.min(this.W - 24, this.px));

    // waves (cheat can speed up or slow down wave progression)
    this.waveTimer += dt * c.waveSpeedMult;
    if (this.waveTimer >= this.waveDuration) {
      this.waveTimer = 0;
      this.wave++;
      this.popups.push({
        x: this.W / 2,
        y: this.H / 2,
        life: 1.6,
        text: `WAVE ${this.wave}`,
        color: "#fbbf24",
      });
    }

    // spawning (spawnMult scales how many appear; 0 = stop spawns)
    if (c.spawnMult > 0) {
      this.spawnTimer -= dt;
      const spawnInterval = Math.max(0.28, 1.15 - this.wave * 0.05);
      if (this.spawnTimer <= 0) {
        this.spawnTimer = spawnInterval * (0.6 + Math.random() * 0.8);
        const n = Math.max(1, Math.round(c.spawnMult));
        for (let i = 0; i < n; i++) this.spawnFaller();
      }
    }

    // regen / repair
    let regen = statValue("regen", this.upgrades);
    if (c.hyperRegen) regen += this.maxHp * 0.5;
    if (regen > 0 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + regen * dt);

    // shield logic (autoBlock forces the barrier up)
    const wantBlock = this.input.block || c.autoBlock;
    const blocking = wantBlock && !this.shieldBroken && this.shield > 0;
    if (c.infiniteShield) {
      this.shieldBroken = false;
      this.shield = this.maxShield;
    } else if (blocking) {
      // shield drains slowly while held even without impacts
      this.shield -= 4 * dt;
      if (this.shield <= 0) {
        this.shield = 0;
        this.breakShield();
      }
    } else if (!wantBlock) {
      if (this.shieldBroken) {
        this.shieldCdTimer -= dt;
        if (c.instantShieldCd || this.shieldCdTimer <= 0) this.shieldBroken = false;
      } else if (this.shield < this.maxShield) {
        this.shield = Math.min(
          this.maxShield,
          this.shield + statValue("shieldRegen", this.upgrades) * dt,
        );
      }
    }

    // combo decay (comboLock keeps it pinned)
    if (this.combo > 0 && !c.comboLock) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // firing
    if ((this.input.shoot || c.autoFire) && !blocking) {
      this.fireTimer -= dt;
      let rate = statValue("fireRate", this.upgrades) * c.fireRateMult;
      if (c.rapidFire) rate *= 6;
      if (this.fireTimer <= 0) {
        this.fireTimer = 1 / rate;
        this.fire(this.px);
      }
    }

    // auto turret (forceTurret guarantees a maxed drone)
    const turret = c.forceTurret ? 5 : statValue("autoTurret", this.upgrades);
    if (turret > 0) {
      this.turretTimer -= dt;
      if (this.turretTimer <= 0) {
        this.turretTimer = 1 / (1 + turret * 0.6);
        // turret fires from a side position, targets nearest
        this.fire(this.px, true);
      }
    }

    this.updateProjectiles(dt);
    this.updateFallers(dt, blocking);
    this.updateParticles(dt);
    this.updatePopups(dt);

    if (this.hurtFlash > 0) this.hurtFlash -= dt;

    if (this.hp <= 0) {
      this.hp = 0;
      this.gameOver();
    }
  }

  private spawnFaller() {
    const c = this.cheats;
    const luck = statValue("luck", this.upgrades) + Math.min(4, this.wave * 0.15) + c.luckAdd;
    const maxIndex = Math.min(FALLING_TYPES.length - 1, 9 + this.wave * 6);
    const idx = Math.floor(Math.random() * (maxIndex + 1));
    const type = FALLING_TYPES[idx]!;
    // maxLuck forces the rarest possible tier
    const rarityId = c.maxLuck ? RARITY_ORDER[RARITY_ORDER.length - 1]! : rollRarity(luck);
    const rarity = RARITIES[rarityId];
    const slow = statValue("slowField", this.upgrades) / 100;
    const hp = Math.max(1, type.hp * rarity.mult * (1 + this.wave * 0.05) * c.enemyHpMult);
    const speed = type.speed * (1 - slow) * (1 + this.wave * 0.03) * (0.9 + Math.random() * 0.2);
    const size = type.size * (0.85 + rarity.mult * 0.04) * c.debrisSizeMult;
    const coins = Math.round(type.coins * rarity.reward);
    this.fallers.push({
      x: 40 + Math.random() * (this.W - 80),
      y: -size,
      vy: speed,
      vx: (Math.random() - 0.5) * 20,
      hp,
      maxHp: hp,
      size,
      type,
      rarity: rarityId,
      coins,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 2,
      hitFlash: 0,
      burn: 0,
    });
  }

  private fire(fromX: number, turret = false) {
    const c = this.cheats;
    const dmg = statValue("damage", this.upgrades) * c.damageMult;
    const projSpeed = statValue("projSpeed", this.upgrades);
    const projSize = statValue("projSize", this.upgrades) * c.projSizeMult;
    // cheat can override the shot count outright
    const baseMulti = turret ? 1 : statValue("multishot", this.upgrades);
    const multishot = !turret && c.multishotSet > 0 ? c.multishotSet : baseMulti;
    const spread = statValue("spread", this.upgrades) + c.extraSpread;
    const pierce = c.infinitePierce ? 9999 : statValue("pierce", this.upgrades);
    const critChance = c.alwaysCrit ? 100 : statValue("crit", this.upgrades);
    const critFactor = c.bigCrit ? 6 : 3;

    const count = Math.round(multishot);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const angle = (t * spread * Math.PI) / 180;
      const crit = Math.random() * 100 < critChance;
      const shotDmg = (crit ? dmg * critFactor : dmg) * (c.oneShot ? 100000 : 1);
      this.projectiles.push({
        x: fromX + (turret ? 22 : 0),
        y: this.H - BASE_OFFSET - 12,
        vy: -Math.cos(angle) * projSpeed,
        vx: Math.sin(angle) * projSpeed,
        dmg: shotDmg,
        size: projSize + (crit ? 2 : 0),
        pierce,
        hitIds: new Set(),
        crit,
        homing: c.homing,
        bounce: c.bounceShots,
        burn: c.burnRounds,
        knockback: c.knockback,
        speed: projSpeed,
      });
    }
  }

  private updateProjectiles(dt: number) {
    const c = this.cheats;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]!;
      // homing: steer the velocity toward the nearest faller
      if (p.homing && this.fallers.length) {
        let best: Faller | null = null;
        let bestD = Infinity;
        for (const f of this.fallers) {
          const d = (f.x - p.x) ** 2 + (f.y - p.y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = f;
          }
        }
        if (best) {
          const ang = Math.atan2(best.y - p.y, best.x - p.x);
          const turn = 6 * dt;
          const cur = Math.atan2(p.vy, p.vx);
          const na = cur + Math.max(-turn, Math.min(turn, angleDiff(cur, ang)));
          p.vx = Math.cos(na) * p.speed;
          p.vy = Math.sin(na) * p.speed;
        }
      }
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      // bounce off side walls instead of despawning
      if (p.bounce) {
        if (p.x < 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x > this.W) {
          p.x = this.W;
          p.vx = -Math.abs(p.vx);
        }
      }
      if (p.y < -20 || (!p.bounce && (p.x < -20 || p.x > this.W + 20))) {
        this.projectiles.splice(i, 1);
        continue;
      }
      // collide with fallers
      for (const f of this.fallers) {
        if (p.hitIds.has(f)) continue;
        const dx = f.x - p.x;
        const dy = f.y - p.y;
        const rr = f.size + p.size;
        if (dx * dx + dy * dy <= rr * rr) {
          // armored: block-preferred take half from shots (noArmor removes this)
          let dmg = p.dmg;
          if (f.type.preferred === "block" && !c.noArmor) dmg *= 0.5;
          f.hp -= dmg;
          f.hitFlash = 0.12;
          if (p.burn) f.burn = Math.max(f.burn, 1.5);
          if (p.knockback) f.vy = -Math.abs(f.vy) - 120;
          if (c.lifesteal) this.hp = Math.min(this.maxHp, this.hp + 2);
          p.hitIds.add(f);
          this.spawnHitParticles(p.x, p.y, RARITIES[f.rarity].color, p.crit);
          if (p.crit)
            this.popups.push({
              x: p.x,
              y: p.y,
              life: 0.6,
              text: "CRIT",
              color: "#fb7185",
            });
          if (f.hp <= 0) {
            this.killFaller(f, "shoot");
          }
          if (p.hitIds.size > p.pierce) {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  private updateFallers(dt: number, blocking: boolean) {
    const baseY = this.H - BASE_OFFSET;
    const shieldY = this.H - SHIELD_OFFSET;
    const magnet = statValue("magnet", this.upgrades);
    const c = this.cheats;
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i]!;
      // gravityMult scales fall speed (0 = frozen, <1 slow, >1 heavy)
      f.y += f.vy * dt * c.gravityMult;
      f.x += f.vx * dt;
      f.spin += f.spinSpeed * dt;
      if (f.hitFlash > 0) f.hitFlash -= dt;

      // burn damage-over-time from incendiary rounds
      if (f.burn > 0) {
        f.burn -= dt;
        f.hp -= statValue("damage", this.upgrades) * this.cheats.damageMult * 2 * dt;
        f.hitFlash = 0.05;
        if (f.hp <= 0) {
          this.killFaller(f, "shoot");
          continue;
        }
      }
      if (f.x < f.size) {
        f.x = f.size;
        f.vx = Math.abs(f.vx);
      } else if (f.x > this.W - f.size) {
        f.x = this.W - f.size;
        f.vx = -Math.abs(f.vx);
      }

      // shield barrier absorb
      if (blocking && f.y + f.size >= shieldY) {
        let cost = f.maxHp;
        if (f.type.preferred === "shoot") cost *= 1.5;
        if (f.type.volatile && !c.noVolatile) cost *= 2;
        if (this.shield >= cost) {
          this.shield -= cost;
          this.killFaller(f, "block");
        } else {
          // partial: break shield, overflow hits hull
          const overflow = (cost - this.shield) * 0.4;
          this.shield = 0;
          this.breakShield();
          this.damagePlayer(overflow);
          this.killFaller(f, "block");
        }
        continue;
      }

      // reached base -> damage
      if (f.y - f.size >= baseY) {
        let dmg = f.maxHp * (f.type.volatile && !c.noVolatile ? 2 : 1);
        dmg = Math.max(4, dmg);
        this.damagePlayer(dmg);
        if (!c.comboLock) this.combo = 0;
        this.spawnHitParticles(f.x, baseY, "#fb7185", true);
        this.fallers.splice(i, 1);
        continue;
      }

      // magnet: nothing to pull yet (coins are instant) — reserved
      void magnet;
    }
  }

  private killFaller(f: Faller, method: "shoot" | "block") {
    const idx = this.fallers.indexOf(f);
    if (idx === -1) return;
    this.fallers.splice(idx, 1);
    this.discovered.add(f.type.id);

    const c = this.cheats;

    // reward
    const coinBonus = statValue("coinBonus", this.upgrades);
    let mult = method === "shoot" ? 1 : 0.6;
    // preferred-method bonus
    if (
      (method === "shoot" && f.type.preferred === "shoot") ||
      (method === "block" && f.type.preferred === "block")
    )
      mult *= 1.5;
    this.combo++;
    this.comboTimer = c.comboLock ? 999 : 2.5;
    const comboMult = 1 + Math.min(this.combo, 30) * 0.03;
    const gained = Math.max(
      1,
      Math.round(f.coins * coinBonus * mult * comboMult * COIN_RATE * c.coinMult),
    );
    this.coins += gained;
    this.score += Math.round((gained + Math.round(f.maxHp)) * c.scoreMult);
    // lifesteal / vampire heal on kill
    if (c.lifesteal) this.hp = Math.min(this.maxHp, this.hp + 4);

    this.popups.push({
      x: f.x,
      y: f.y,
      life: 0.9,
      text: `+${gained}`,
      color: RARITIES[f.rarity].color,
    });
    this.spawnDeathParticles(f.x, f.y, RARITIES[f.rarity].color, f.size);

    // explosive splash (cheats can force it, widen it, or chain damage)
    let blast = statValue("explosive", this.upgrades);
    if (c.allExplosive && blast <= 0) blast = 90;
    if (c.bigBlast) blast = Math.max(blast, 90) * 3;
    const chain = c.chainKills;
    if (blast > 0 || chain) {
      const radius = blast > 0 ? blast : 160;
      const dmg = statValue("damage", this.upgrades) * c.damageMult * (chain ? 4 : 0.75);
      for (const other of this.fallers) {
        const dx = other.x - f.x;
        const dy = other.y - f.y;
        if (dx * dx + dy * dy <= radius * radius) {
          other.hp -= dmg;
          other.hitFlash = 0.1;
          if (other.hp <= 0) this.killFaller(other, "shoot");
        }
      }
      this.spawnBlast(f.x, f.y, radius);
    }

    // splits
    if (f.type.splits && f.size > 12) {
      for (let k = 0; k < 2; k++) {
        this.fallers.push({
          x: f.x + (k === 0 ? -f.size / 2 : f.size / 2),
          y: f.y,
          vy: f.vy * 1.1,
          vx: (k === 0 ? -1 : 1) * 40,
          hp: f.maxHp * 0.4,
          maxHp: f.maxHp * 0.4,
          size: f.size * 0.6,
          type: f.type,
          rarity: f.rarity,
          coins: Math.max(1, Math.round(f.coins * 0.4)),
          spin: 0,
          spinSpeed: (Math.random() - 0.5) * 3,
          hitFlash: 0,
          burn: 0,
        });
      }
    }
  }

  private damagePlayer(dmg: number) {
    const c = this.cheats;
    if (c.godMode) return;
    if (c.ghostArmor) dmg *= 0.1;
    this.hp -= dmg;
    if (!c.noHurtFlash) this.hurtFlash = 0.35;
    // thorns / reflect: retaliate by clearing the field
    if ((c.thorns || c.reflectDamage) && this.fallers.length) {
      for (const other of [...this.fallers]) this.killFaller(other, "shoot");
    }
  }

  private breakShield() {
    this.shieldBroken = true;
    this.shieldCdTimer = statValue("shieldCooldown", this.upgrades);
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        x: this.px,
        y: this.H - SHIELD_OFFSET,
        vx: Math.cos(a) * 160,
        vy: Math.sin(a) * 120,
        life: 0.5,
        maxLife: 0.5,
        color: "#38bdf8",
        size: 3,
      });
    }
  }

  private spawnHitParticles(x: number, y: number, color: string, crit: boolean) {
    const n = crit ? 8 : 4;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35,
        maxLife: 0.35,
        color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  private spawnDeathParticles(x: number, y: number, color: string, size: number) {
    const n = Math.min(26, 8 + Math.floor(size));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private spawnBlast(x: number, y: number, r: number) {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * r * 4,
        vy: Math.sin(a) * r * 4,
        life: 0.3,
        maxLife: 0.3,
        color: "#fb923c",
        size: 3,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.vx *= 0.96;
    }
  }

  private updatePopups(dt: number) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i]!;
      p.life -= dt;
      p.y -= 26 * dt;
      if (p.life <= 0) this.popups.splice(i, 1);
    }
  }

  private gameOver() {
    this.pause();
    this.onGameOver();
  }

  // ---- render ----
  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // background
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, "#0a0a1a");
    grad.addColorStop(1, "#12071e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    // stars
    for (const s of this.stars) {
      s.y += s.z * 12 * (1 / 60);
      if (s.y > this.H) {
        s.y = 0;
        s.x = Math.random() * this.W;
      }
      ctx.globalAlpha = s.z;
      ctx.fillStyle = "#c7d2fe";
      ctx.fillRect(s.x, s.y, s.z * 2, s.z * 2);
    }
    ctx.globalAlpha = 1;

    this.renderFallers();
    this.renderProjectiles();
    this.renderParticles();
    this.renderPlayer();
    this.renderPopups();

    // hurt vignette
    if (this.hurtFlash > 0) {
      ctx.fillStyle = `rgba(251,113,133,${this.hurtFlash * 0.5})`;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }

  private renderProjectiles() {
    const ctx = this.ctx;
    const rainbow = this.cheats.rainbow;
    const bs = this.bulletSkin;
    for (const p of this.projectiles) {
      const len = Math.hypot(p.vx, p.vy) || 1;
      const ux = p.vx / len;
      const uy = p.vy / len;
      // facing angle (0 = travelling "up" the screen)
      const angle = Math.atan2(p.vx, -p.vy);

      let core: string;
      let glow: string;
      if (rainbow) {
        const hue = (this.rainbowHue + p.x + p.y) % 360;
        core = `hsl(${hue},100%,70%)`;
        glow = `hsl(${hue},100%,60%)`;
      } else {
        core = p.crit ? bs.crit : bs.core;
        glow = p.crit ? bs.crit : bs.glow;
      }

      // ---- trail ----
      if (bs.trail !== "none") {
        ctx.save();
        ctx.shadowBlur = 0;
        if (bs.trail === "streak") {
          ctx.strokeStyle = glow;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = p.size * 1.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - ux * p.size * 7, p.y - uy * p.size * 7);
          ctx.stroke();
        } else if (bs.trail === "comet") {
          for (let t = 1; t <= 4; t++) {
            ctx.globalAlpha = 0.35 / t;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(
              p.x - ux * p.size * 2.2 * t,
              p.y - uy * p.size * 2.2 * t,
              p.size * (1 - t * 0.18),
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        } else if (bs.trail === "sparks") {
          ctx.fillStyle = core;
          for (let t = 1; t <= 5; t++) {
            const j = Math.sin((p.x + p.y + t * 37) * 0.35) * p.size * 1.6;
            ctx.globalAlpha = 0.5 / t;
            ctx.beginPath();
            ctx.arc(
              p.x - ux * p.size * 2.4 * t - uy * j,
              p.y - uy * p.size * 2.4 * t + ux * j,
              Math.max(0.6, p.size * 0.3),
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        } else {
          // smoke
          ctx.fillStyle = glow;
          for (let t = 1; t <= 4; t++) {
            ctx.globalAlpha = 0.18 / t;
            ctx.beginPath();
            ctx.arc(
              p.x - ux * p.size * 3 * t,
              p.y - uy * p.size * 3 * t,
              p.size * (1 + t * 0.35),
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // ---- core shape ----
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.shadowBlur = 14;
      ctx.shadowColor = glow;
      ctx.fillStyle = core;
      ctx.strokeStyle = core;
      const s = p.size;
      switch (bs.shape) {
        case "orb":
          ctx.beginPath();
          ctx.arc(0, 0, s * 1.35, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "diamond":
          ctx.beginPath();
          ctx.moveTo(0, -s * 2.2);
          ctx.lineTo(s * 1.1, 0);
          ctx.lineTo(0, s * 2.2);
          ctx.lineTo(-s * 1.1, 0);
          ctx.closePath();
          ctx.fill();
          break;
        case "star":
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? s * 2.2 : s * 0.9;
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const fx = Math.cos(a) * r;
            const fy = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(fx, fy);
            else ctx.lineTo(fx, fy);
          }
          ctx.closePath();
          ctx.fill();
          break;
        case "beam":
          ctx.beginPath();
          ctx.roundRect(-s * 0.5, -s * 4, s, s * 8, s * 0.5);
          ctx.fill();
          break;
        case "ring":
          ctx.lineWidth = Math.max(1.2, s * 0.55);
          ctx.beginPath();
          ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "arrow":
          ctx.beginPath();
          ctx.moveTo(0, -s * 2.6);
          ctx.lineTo(s * 1.3, s * 1.2);
          ctx.lineTo(0, s * 0.4);
          ctx.lineTo(-s * 1.3, s * 1.2);
          ctx.closePath();
          ctx.fill();
          break;
        case "spark":
          ctx.lineWidth = Math.max(1, s * 0.5);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * s * 2, Math.sin(a) * s * 2);
          }
          ctx.stroke();
          break;
        case "cross":
          ctx.beginPath();
          ctx.rect(-s * 0.45, -s * 2.4, s * 0.9, s * 4.8);
          ctx.rect(-s * 1.8, -s * 0.45, s * 3.6, s * 0.9);
          ctx.fill();
          break;
        case "blade":
          ctx.beginPath();
          ctx.moveTo(0, -s * 3);
          ctx.quadraticCurveTo(s * 1.4, -s * 0.5, 0, s * 2.4);
          ctx.quadraticCurveTo(-s * 1.4, -s * 0.5, 0, -s * 3);
          ctx.fill();
          break;
        default:
          ctx.beginPath();
          ctx.ellipse(0, 0, s, s * 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderFallers() {
    const ctx = this.ctx;
    for (const f of this.fallers) {
      const r = RARITIES[f.rarity];
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.spin);
      ctx.shadowBlur = 16;
      ctx.shadowColor = r.glow;
      ctx.fillStyle = f.hitFlash > 0 ? "#ffffff" : r.color;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      this.drawShape(f.type.shape, f.size);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // hp bar for tougher ones
      if (f.maxHp > 4 && f.hp < f.maxHp) {
        const w = f.size * 2;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(f.x - w / 2, f.y - f.size - 8, w, 3);
        ctx.fillStyle = r.color;
        ctx.fillRect(f.x - w / 2, f.y - f.size - 8, w * (f.hp / f.maxHp), 3);
      }

      // admin hitbox overlay
      if (this.cheats.showHitboxes) {
        ctx.strokeStyle = "rgba(74,222,128,0.9)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private drawShape(shape: Shape, s: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    switch (shape) {
      case "circle":
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        break;
      case "square":
        ctx.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
        break;
      case "diamond":
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.8, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.8, 0);
        ctx.closePath();
        break;
      case "triangle":
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.9, s * 0.7);
        ctx.lineTo(-s * 0.9, s * 0.7);
        ctx.closePath();
        break;
      case "hex":
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          const px = Math.cos(a) * s;
          const py = Math.sin(a) * s;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "pentagon":
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * s;
          const py = Math.sin(a) * s;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "star":
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const rad = i % 2 === 0 ? s : s * 0.45;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "cross":
        {
          const t = s * 0.4;
          ctx.rect(-t, -s, t * 2, s * 2);
          ctx.rect(-s, -t, s * 2, t * 2);
        }
        break;
    }
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private renderPlayer() {
    const ctx = this.ctx;
    const baseY = this.H - BASE_OFFSET;
    const shieldY = this.H - SHIELD_OFFSET;
    const blocking =
      (this.input.block || this.cheats.autoBlock) && !this.shieldBroken && this.shield > 0;

    // shield barrier
    if (blocking) {
      const alpha = 0.25 + (this.shield / this.maxShield) * 0.35;
      const g = ctx.createLinearGradient(0, shieldY - 10, 0, shieldY + 10);
      g.addColorStop(0, `rgba(56,189,248,0)`);
      g.addColorStop(0.5, `rgba(56,189,248,${alpha})`);
      g.addColorStop(1, `rgba(56,189,248,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, shieldY - 12, this.W, 24);
      ctx.strokeStyle = `rgba(125,211,252,${0.5 + alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(0, shieldY);
      ctx.lineTo(this.W, shieldY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (this.shieldBroken) {
      ctx.strokeStyle = "rgba(148,163,184,0.25)";
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, shieldY);
      ctx.lineTo(this.W, shieldY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // player ship
    const skin = this.skin;
    const c = this.cheats;
    const scale = c.bigPlayer ? 1.9 : c.tinyPlayer ? 0.55 : 1;
    const bodyColor = c.goldenShip ? "#fbbf24" : skin.body;
    const glowColor = c.goldenShip ? "#f59e0b" : skin.glow;
    ctx.save();
    ctx.translate(this.px, baseY);
    ctx.scale(scale, scale);
    if (c.stealthShip) ctx.globalAlpha = 0.35;
    ctx.shadowBlur = 18;
    ctx.shadowColor = glowColor;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(16, 12);
    ctx.lineTo(6, 6);
    ctx.lineTo(-6, 6);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();
    // cockpit
    ctx.shadowBlur = 0;
    ctx.fillStyle = c.goldenShip ? "#fffbeb" : skin.cockpit;
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    // thruster flame
    if (this.input.shoot && !blocking) {
      ctx.fillStyle = skin.thruster;
      ctx.beginPath();
      ctx.moveTo(-4, 8);
      ctx.lineTo(0, 8 + 8 + Math.random() * 6);
      ctx.lineTo(4, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private renderPopups() {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    for (const p of this.popups) {
      ctx.globalAlpha = Math.min(1, p.life * 1.5);
      const big = p.text.startsWith("WAVE");
      ctx.font = big ? "bold 34px ui-sans-serif, system-ui" : "bold 15px ui-sans-serif, system-ui";
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "start";
  }
}
