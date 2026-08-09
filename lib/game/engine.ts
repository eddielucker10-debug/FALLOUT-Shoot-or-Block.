import { FALLING_TYPES, type FallingType, type Shape } from "./objects"
import { RARITIES, rollRarity, type RarityId } from "./rarities"
import {
  initialUpgradeState,
  statValue,
  type UpgradeState,
} from "./upgrades"

export interface GameStats {
  hp: number
  maxHp: number
  shield: number
  maxShield: number
  shieldReady: boolean
  blocking: boolean
  coins: number
  score: number
  wave: number
  combo: number
  discovered: number
  waveProgress: number
  running: boolean
}

interface Faller {
  x: number
  y: number
  vy: number
  vx: number
  hp: number
  maxHp: number
  size: number
  type: FallingType
  rarity: RarityId
  coins: number
  spin: number
  spinSpeed: number
  hitFlash: number
}

interface Projectile {
  x: number
  y: number
  vy: number
  vx: number
  dmg: number
  size: number
  pierce: number
  hitIds: Set<Faller>
  crit: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Popup {
  x: number
  y: number
  life: number
  text: string
  color: string
}

interface Star {
  x: number
  y: number
  z: number
}

const BASE_OFFSET = 46 // player line from bottom
const SHIELD_OFFSET = 96 // shield barrier from bottom

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  W = 0
  H = 0
  dpr = 1

  private raf = 0
  private last = 0
  running = false

  // input
  input = { targetX: 0, moving: false, shoot: false, block: false }

  // world
  private fallers: Faller[] = []
  private projectiles: Projectile[] = []
  private particles: Particle[] = []
  private popups: Popup[] = []
  private stars: Star[] = []
  private discovered = new Set<number>()

  // player
  private px = 0
  private hp = 100
  private maxHp = 100
  private shield = 60
  private maxShield = 60
  private shieldBroken = false
  private shieldCdTimer = 0
  private fireTimer = 0
  private turretTimer = 0
  private hurtFlash = 0

  // meta
  coins = 0
  private score = 0
  private wave = 1
  private waveTimer = 0
  private waveDuration = 22
  private spawnTimer = 0
  private combo = 0
  private comboTimer = 0

  private upgrades: UpgradeState = initialUpgradeState()
  private onStats: (s: GameStats) => void
  private onGameOver: () => void
  private statsAccum = 0

  constructor(
    canvas: HTMLCanvasElement,
    onStats: (s: GameStats) => void,
    onGameOver: () => void,
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")!
    this.onStats = onStats
    this.onGameOver = onGameOver
    this.resize()
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.W = rect.width
    this.H = rect.height
    this.canvas.width = Math.floor(this.W * this.dpr)
    this.canvas.height = Math.floor(this.H * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    if (this.px === 0) this.px = this.W / 2
    if (this.stars.length === 0) this.initStars()
  }

  private initStars() {
    this.stars = []
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        z: Math.random() * 0.8 + 0.2,
      })
    }
  }

  setUpgrades(state: UpgradeState) {
    this.upgrades = state
    const newMax = statValue("maxHealth", state)
    // keep same ratio-ish; give the extra hp on upgrade
    const extra = newMax - this.maxHp
    this.maxHp = newMax
    if (extra > 0) this.hp = Math.min(this.maxHp, this.hp + extra)
    this.maxShield = statValue("shieldPower", state)
    if (this.shield > this.maxShield) this.shield = this.maxShield
  }

  reset() {
    this.fallers = []
    this.projectiles = []
    this.particles = []
    this.popups = []
    this.px = this.W / 2
    this.maxHp = statValue("maxHealth", this.upgrades)
    this.hp = this.maxHp
    this.maxShield = statValue("shieldPower", this.upgrades)
    this.shield = this.maxShield
    this.shieldBroken = false
    this.shieldCdTimer = 0
    this.coins = 0
    this.score = 0
    this.wave = 1
    this.waveTimer = 0
    this.spawnTimer = 0
    this.combo = 0
    this.comboTimer = 0
    this.hurtFlash = 0
    this.input.shoot = false
    this.input.block = false
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  pause() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  resume() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    this.pause()
  }

  private loop = (now: number) => {
    if (!this.running) return
    let dt = (now - this.last) / 1000
    this.last = now
    if (dt > 0.05) dt = 0.05 // clamp big frame gaps
    this.update(dt)
    this.render()
    this.statsAccum += dt
    if (this.statsAccum > 0.08) {
      this.statsAccum = 0
      this.emitStats()
    }
    this.raf = requestAnimationFrame(this.loop)
  }

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
    })
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
    }
  }

  // ---- update ----
  private update(dt: number) {
    const moveSpeed = statValue("moveSpeed", this.upgrades)
    // move player toward target
    const dx = this.input.targetX - this.px
    const maxStep = moveSpeed * dt
    if (Math.abs(dx) <= maxStep) this.px = this.input.targetX
    else this.px += Math.sign(dx) * maxStep
    this.px = Math.max(24, Math.min(this.W - 24, this.px))

    // waves
    this.waveTimer += dt
    if (this.waveTimer >= this.waveDuration) {
      this.waveTimer = 0
      this.wave++
      this.popups.push({
        x: this.W / 2,
        y: this.H / 2,
        life: 1.6,
        text: `WAVE ${this.wave}`,
        color: "#fbbf24",
      })
    }

    // spawning
    this.spawnTimer -= dt
    const spawnInterval = Math.max(0.28, 1.15 - this.wave * 0.05)
    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnInterval * (0.6 + Math.random() * 0.8)
      this.spawnFaller()
    }

    // regen / repair
    const regen = statValue("regen", this.upgrades)
    if (regen > 0 && this.hp < this.maxHp)
      this.hp = Math.min(this.maxHp, this.hp + regen * dt)

    // shield logic
    const blocking = this.input.block && !this.shieldBroken && this.shield > 0
    if (blocking) {
      // shield drains slowly while held even without impacts
      this.shield -= 4 * dt
      if (this.shield <= 0) {
        this.shield = 0
        this.breakShield()
      }
    } else if (!this.input.block) {
      if (this.shieldBroken) {
        this.shieldCdTimer -= dt
        if (this.shieldCdTimer <= 0) this.shieldBroken = false
      } else if (this.shield < this.maxShield) {
        this.shield = Math.min(
          this.maxShield,
          this.shield + statValue("shieldRegen", this.upgrades) * dt,
        )
      }
    }

    // combo decay
    if (this.combo > 0) {
      this.comboTimer -= dt
      if (this.comboTimer <= 0) this.combo = 0
    }

    // firing
    if (this.input.shoot && !blocking) {
      this.fireTimer -= dt
      const rate = statValue("fireRate", this.upgrades)
      if (this.fireTimer <= 0) {
        this.fireTimer = 1 / rate
        this.fire(this.px)
      }
    }

    // auto turret
    const turret = statValue("autoTurret", this.upgrades)
    if (turret > 0) {
      this.turretTimer -= dt
      if (this.turretTimer <= 0) {
        this.turretTimer = 1 / (1 + turret * 0.6)
        // turret fires from a side position, targets nearest
        this.fire(this.px, true)
      }
    }

    this.updateProjectiles(dt)
    this.updateFallers(dt, blocking)
    this.updateParticles(dt)
    this.updatePopups(dt)

    if (this.hurtFlash > 0) this.hurtFlash -= dt

    if (this.hp <= 0) {
      this.hp = 0
      this.gameOver()
    }
  }

  private spawnFaller() {
    const luck =
      statValue("luck", this.upgrades) + Math.min(4, this.wave * 0.15)
    const maxIndex = Math.min(FALLING_TYPES.length - 1, 9 + this.wave * 6)
    const idx = Math.floor(Math.random() * (maxIndex + 1))
    const type = FALLING_TYPES[idx]
    const rarityId = rollRarity(luck)
    const rarity = RARITIES[rarityId]
    const slow = statValue("slowField", this.upgrades) / 100
    const hp = Math.max(1, type.hp * rarity.mult * (1 + this.wave * 0.05))
    const speed =
      type.speed * (1 - slow) * (1 + this.wave * 0.03) * (0.9 + Math.random() * 0.2)
    const size = type.size * (0.85 + rarity.mult * 0.04)
    const coins = Math.round(type.coins * rarity.reward)
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
    })
  }

  private fire(fromX: number, turret = false) {
    const dmg = statValue("damage", this.upgrades)
    const projSpeed = statValue("projSpeed", this.upgrades)
    const projSize = statValue("projSize", this.upgrades)
    const multishot = turret ? 1 : statValue("multishot", this.upgrades)
    const spread = statValue("spread", this.upgrades)
    const pierce = statValue("pierce", this.upgrades)
    const critChance = statValue("crit", this.upgrades)

    const count = Math.round(multishot)
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5
      const angle = (t * spread * Math.PI) / 180
      const crit = Math.random() * 100 < critChance
      this.projectiles.push({
        x: fromX + (turret ? 22 : 0),
        y: this.H - BASE_OFFSET - 12,
        vy: -Math.cos(angle) * projSpeed,
        vx: Math.sin(angle) * projSpeed,
        dmg: crit ? dmg * 3 : dmg,
        size: projSize + (crit ? 2 : 0),
        pierce,
        hitIds: new Set(),
        crit,
      })
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      p.y += p.vy * dt
      p.x += p.vx * dt
      if (p.y < -20 || p.x < -20 || p.x > this.W + 20) {
        this.projectiles.splice(i, 1)
        continue
      }
      // collide with fallers
      for (const f of this.fallers) {
        if (p.hitIds.has(f)) continue
        const dx = f.x - p.x
        const dy = f.y - p.y
        const rr = f.size + p.size
        if (dx * dx + dy * dy <= rr * rr) {
          // armored: block-preferred take half from shots
          let dmg = p.dmg
          if (f.type.preferred === "block") dmg *= 0.5
          f.hp -= dmg
          f.hitFlash = 0.12
          p.hitIds.add(f)
          this.spawnHitParticles(p.x, p.y, RARITIES[f.rarity].color, p.crit)
          if (p.crit)
            this.popups.push({
              x: p.x,
              y: p.y,
              life: 0.6,
              text: "CRIT",
              color: "#fb7185",
            })
          if (f.hp <= 0) {
            this.killFaller(f, "shoot")
          }
          if (p.hitIds.size > p.pierce) {
            this.projectiles.splice(i, 1)
            break
          }
        }
      }
    }
  }

  private updateFallers(dt: number, blocking: boolean) {
    const baseY = this.H - BASE_OFFSET
    const shieldY = this.H - SHIELD_OFFSET
    const magnet = statValue("magnet", this.upgrades)
    for (let i = this.fallers.length - 1; i >= 0; i--) {
      const f = this.fallers[i]
      f.y += f.vy * dt
      f.x += f.vx * dt
      f.spin += f.spinSpeed * dt
      if (f.hitFlash > 0) f.hitFlash -= dt
      if (f.x < f.size) {
        f.x = f.size
        f.vx = Math.abs(f.vx)
      } else if (f.x > this.W - f.size) {
        f.x = this.W - f.size
        f.vx = -Math.abs(f.vx)
      }

      // shield barrier absorb
      if (blocking && f.y + f.size >= shieldY) {
        let cost = f.maxHp
        if (f.type.preferred === "shoot") cost *= 1.5
        if (f.type.volatile) cost *= 2
        if (this.shield >= cost) {
          this.shield -= cost
          this.killFaller(f, "block")
        } else {
          // partial: break shield, overflow hits hull
          const overflow = (cost - this.shield) * 0.4
          this.shield = 0
          this.breakShield()
          this.damagePlayer(overflow)
          this.killFaller(f, "block")
        }
        continue
      }

      // reached base -> damage
      if (f.y - f.size >= baseY) {
        let dmg = f.maxHp * (f.type.volatile ? 2 : 1)
        dmg = Math.max(4, dmg)
        this.damagePlayer(dmg)
        this.combo = 0
        this.spawnHitParticles(f.x, baseY, "#fb7185", true)
        this.fallers.splice(i, 1)
        continue
      }

      // magnet: nothing to pull yet (coins are instant) — reserved
      void magnet
    }
  }

  private killFaller(f: Faller, method: "shoot" | "block") {
    const idx = this.fallers.indexOf(f)
    if (idx === -1) return
    this.fallers.splice(idx, 1)
    this.discovered.add(f.type.id)

    // reward
    const coinBonus = statValue("coinBonus", this.upgrades)
    let mult = method === "shoot" ? 1 : 0.6
    // preferred-method bonus
    if (
      (method === "shoot" && f.type.preferred === "shoot") ||
      (method === "block" && f.type.preferred === "block")
    )
      mult *= 1.5
    this.combo++
    this.comboTimer = 2.5
    const comboMult = 1 + Math.min(this.combo, 30) * 0.03
    const gained = Math.max(1, Math.round(f.coins * coinBonus * mult * comboMult))
    this.coins += gained
    this.score += gained + Math.round(f.maxHp)

    this.popups.push({
      x: f.x,
      y: f.y,
      life: 0.9,
      text: `+${gained}`,
      color: RARITIES[f.rarity].color,
    })
    this.spawnDeathParticles(f.x, f.y, RARITIES[f.rarity].color, f.size)

    // explosive splash
    const blast = statValue("explosive", this.upgrades)
    if (blast > 0) {
      const dmg = statValue("damage", this.upgrades) * 0.75
      for (const other of this.fallers) {
        const dx = other.x - f.x
        const dy = other.y - f.y
        if (dx * dx + dy * dy <= blast * blast) {
          other.hp -= dmg
          other.hitFlash = 0.1
          if (other.hp <= 0) this.killFaller(other, "shoot")
        }
      }
      this.spawnBlast(f.x, f.y, blast)
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
        })
      }
    }
  }

  private damagePlayer(dmg: number) {
    this.hp -= dmg
    this.hurtFlash = 0.35
  }

  private breakShield() {
    this.shieldBroken = true
    this.shieldCdTimer = statValue("shieldCooldown", this.upgrades)
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2
      this.particles.push({
        x: this.px,
        y: this.H - SHIELD_OFFSET,
        vx: Math.cos(a) * 160,
        vy: Math.sin(a) * 120,
        life: 0.5,
        maxLife: 0.5,
        color: "#38bdf8",
        size: 3,
      })
    }
  }

  private spawnHitParticles(x: number, y: number, color: string, crit: boolean) {
    const n = crit ? 8 : 4
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 60 + Math.random() * 120
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35,
        maxLife: 0.35,
        color,
        size: 2 + Math.random() * 2,
      })
    }
  }

  private spawnDeathParticles(x: number, y: number, color: string, size: number) {
    const n = Math.min(26, 8 + Math.floor(size))
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 80 + Math.random() * 200
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  private spawnBlast(x: number, y: number, r: number) {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * r * 4,
        vy: Math.sin(a) * r * 4,
        life: 0.3,
        maxLife: 0.3,
        color: "#fb923c",
        size: 3,
      })
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 260 * dt
      p.vx *= 0.96
    }
  }

  private updatePopups(dt: number) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i]
      p.life -= dt
      p.y -= 26 * dt
      if (p.life <= 0) this.popups.splice(i, 1)
    }
  }

  private gameOver() {
    this.pause()
    this.onGameOver()
  }

  // ---- render ----
  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.W, this.H)

    // background
    const grad = ctx.createLinearGradient(0, 0, 0, this.H)
    grad.addColorStop(0, "#0a0a1a")
    grad.addColorStop(1, "#12071e")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.W, this.H)

    // stars
    for (const s of this.stars) {
      s.y += s.z * 12 * (1 / 60)
      if (s.y > this.H) {
        s.y = 0
        s.x = Math.random() * this.W
      }
      ctx.globalAlpha = s.z
      ctx.fillStyle = "#c7d2fe"
      ctx.fillRect(s.x, s.y, s.z * 2, s.z * 2)
    }
    ctx.globalAlpha = 1

    this.renderFallers()
    this.renderProjectiles()
    this.renderParticles()
    this.renderPlayer()
    this.renderPopups()

    // hurt vignette
    if (this.hurtFlash > 0) {
      ctx.fillStyle = `rgba(251,113,133,${this.hurtFlash * 0.5})`
      ctx.fillRect(0, 0, this.W, this.H)
    }
  }

  private renderProjectiles() {
    const ctx = this.ctx
    for (const p of this.projectiles) {
      ctx.save()
      ctx.shadowBlur = 12
      ctx.shadowColor = p.crit ? "#fb7185" : "#67e8f9"
      ctx.fillStyle = p.crit ? "#fecdd3" : "#a5f3fc"
      ctx.beginPath()
      ctx.ellipse(p.x, p.y, p.size, p.size * 1.8, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  private renderFallers() {
    const ctx = this.ctx
    for (const f of this.fallers) {
      const r = RARITIES[f.rarity]
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(f.spin)
      ctx.shadowBlur = 16
      ctx.shadowColor = r.glow
      ctx.fillStyle = f.hitFlash > 0 ? "#ffffff" : r.color
      ctx.strokeStyle = "rgba(255,255,255,0.35)"
      ctx.lineWidth = 1.5
      this.drawShape(f.type.shape, f.size)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // hp bar for tougher ones
      if (f.maxHp > 4 && f.hp < f.maxHp) {
        const w = f.size * 2
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(f.x - w / 2, f.y - f.size - 8, w, 3)
        ctx.fillStyle = r.color
        ctx.fillRect(f.x - w / 2, f.y - f.size - 8, w * (f.hp / f.maxHp), 3)
      }
    }
  }

  private drawShape(shape: Shape, s: number) {
    const ctx = this.ctx
    ctx.beginPath()
    switch (shape) {
      case "circle":
        ctx.arc(0, 0, s, 0, Math.PI * 2)
        break
      case "square":
        ctx.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6)
        break
      case "diamond":
        ctx.moveTo(0, -s)
        ctx.lineTo(s * 0.8, 0)
        ctx.lineTo(0, s)
        ctx.lineTo(-s * 0.8, 0)
        ctx.closePath()
        break
      case "triangle":
        ctx.moveTo(0, -s)
        ctx.lineTo(s * 0.9, s * 0.7)
        ctx.lineTo(-s * 0.9, s * 0.7)
        ctx.closePath()
        break
      case "hex":
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6
          const px = Math.cos(a) * s
          const py = Math.sin(a) * s
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        break
      case "pentagon":
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2
          const px = Math.cos(a) * s
          const py = Math.sin(a) * s
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        break
      case "star":
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2
          const rad = i % 2 === 0 ? s : s * 0.45
          const px = Math.cos(a) * rad
          const py = Math.sin(a) * rad
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        break
      case "cross":
        {
          const t = s * 0.4
          ctx.rect(-t, -s, t * 2, s * 2)
          ctx.rect(-s, -t, s * 2, t * 2)
        }
        break
    }
  }

  private renderParticles() {
    const ctx = this.ctx
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1
  }

  private renderPlayer() {
    const ctx = this.ctx
    const baseY = this.H - BASE_OFFSET
    const shieldY = this.H - SHIELD_OFFSET
    const blocking = this.input.block && !this.shieldBroken && this.shield > 0

    // shield barrier
    if (blocking) {
      const alpha = 0.25 + (this.shield / this.maxShield) * 0.35
      const g = ctx.createLinearGradient(0, shieldY - 10, 0, shieldY + 10)
      g.addColorStop(0, `rgba(56,189,248,0)`)
      g.addColorStop(0.5, `rgba(56,189,248,${alpha})`)
      g.addColorStop(1, `rgba(56,189,248,0)`)
      ctx.fillStyle = g
      ctx.fillRect(0, shieldY - 12, this.W, 24)
      ctx.strokeStyle = `rgba(125,211,252,${0.5 + alpha})`
      ctx.lineWidth = 2
      ctx.shadowBlur = 14
      ctx.shadowColor = "#38bdf8"
      ctx.beginPath()
      ctx.moveTo(0, shieldY)
      ctx.lineTo(this.W, shieldY)
      ctx.stroke()
      ctx.shadowBlur = 0
    } else if (this.shieldBroken) {
      ctx.strokeStyle = "rgba(148,163,184,0.25)"
      ctx.setLineDash([8, 8])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, shieldY)
      ctx.lineTo(this.W, shieldY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // player ship
    ctx.save()
    ctx.translate(this.px, baseY)
    ctx.shadowBlur = 18
    ctx.shadowColor = "#a78bfa"
    ctx.fillStyle = "#c4b5fd"
    ctx.beginPath()
    ctx.moveTo(0, -20)
    ctx.lineTo(16, 12)
    ctx.lineTo(6, 6)
    ctx.lineTo(-6, 6)
    ctx.lineTo(-16, 12)
    ctx.closePath()
    ctx.fill()
    // cockpit
    ctx.shadowBlur = 0
    ctx.fillStyle = "#7c3aed"
    ctx.beginPath()
    ctx.arc(0, -4, 4, 0, Math.PI * 2)
    ctx.fill()
    // thruster flame
    if (this.input.shoot && !blocking) {
      ctx.fillStyle = "#67e8f9"
      ctx.beginPath()
      ctx.moveTo(-4, 8)
      ctx.lineTo(0, 8 + 8 + Math.random() * 6)
      ctx.lineTo(4, 8)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  private renderPopups() {
    const ctx = this.ctx
    ctx.textAlign = "center"
    for (const p of this.popups) {
      ctx.globalAlpha = Math.min(1, p.life * 1.5)
      const big = p.text.startsWith("WAVE")
      ctx.font = big
        ? "bold 34px ui-sans-serif, system-ui"
        : "bold 15px ui-sans-serif, system-ui"
      ctx.fillStyle = p.color
      ctx.shadowBlur = 8
      ctx.shadowColor = p.color
      ctx.fillText(p.text, p.x, p.y)
      ctx.shadowBlur = 0
    }
    ctx.globalAlpha = 1
    ctx.textAlign = "start"
  }
}
