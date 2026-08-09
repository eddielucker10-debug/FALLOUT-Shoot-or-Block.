"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Crosshair, Pause, Play, Shield, ShoppingCart, X } from "lucide-react"
import { GameEngine, type GameStats } from "@/lib/game/engine"
import {
  initialUpgradeState,
  upgradeCost,
  type Upgrade,
  type UpgradeState,
} from "@/lib/game/upgrades"
import { Button } from "@/components/ui/button"
import { Hud } from "./hud"
import { UpgradeShop } from "./upgrade-shop"
import { GameOverScreen, RarityLegend, StartScreen } from "./overlays"

type Phase = "start" | "playing" | "paused" | "over"

const SAVE_KEY = "fallout:save:v1"

const EMPTY_STATS: GameStats = {
  hp: 100,
  maxHp: 100,
  shield: 60,
  maxShield: 60,
  shieldReady: true,
  blocking: false,
  coins: 0,
  score: 0,
  wave: 1,
  combo: 0,
  discovered: 0,
  waveProgress: 0,
  running: false,
}

export function FallingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const [phase, setPhase] = useState<Phase>("start")
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS)
  const [upgrades, setUpgrades] = useState<UpgradeState>(initialUpgradeState())
  const [bankCoins, setBankCoins] = useState(0)
  const [best, setBest] = useState(0)
  const [shopOpen, setShopOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const isMobileRef = useRef(false)
  isMobileRef.current = isMobile

  // ---- phone detection ----
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)")
    const uaIsPhone =
      /Android|iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      )
    const compute = () => {
      const hasTouch =
        navigator.maxTouchPoints > 0 || "ontouchstart" in window
      // phone when the UA says so, when the primary pointer is touch, or a
      // touch device on a small viewport (covers phones + small tablets)
      const mobile =
        uaIsPhone ||
        (coarse.matches && hasTouch) ||
        (hasTouch && window.innerWidth < 900)
      setIsMobile(mobile)
    }
    compute()
    coarse.addEventListener?.("change", compute)
    window.addEventListener("resize", compute)
    window.addEventListener("orientationchange", compute)
    return () => {
      coarse.removeEventListener?.("change", compute)
      window.removeEventListener("resize", compute)
      window.removeEventListener("orientationchange", compute)
    }
  }, [])

  // ---- persistence (game save state) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (s.upgrades) setUpgrades({ ...initialUpgradeState(), ...s.upgrades })
        if (typeof s.coins === "number") setBankCoins(s.coins)
        if (typeof s.best === "number") setBest(s.best)
      }
    } catch {
      /* ignore corrupt save */
    }
  }, [])

  const persist = useCallback(
    (next: { upgrades?: UpgradeState; coins?: number; best?: number }) => {
      try {
        const cur = {
          upgrades,
          coins: bankCoins,
          best,
          ...next,
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(cur))
      } catch {
        /* storage unavailable */
      }
    },
    [upgrades, bankCoins, best],
  )

  // ---- engine setup ----
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine(
      canvas,
      (s) => setStats(s),
      () => {
        // game over
        const finalCoins = engine.coins
        const finalScore = engine.getStats().score
        setPhase("over")
        setBankCoins((prev) => {
          const total = prev + finalCoins
          setBest((b) => {
            const nb = Math.max(b, finalScore)
            try {
              localStorage.setItem(
                SAVE_KEY,
                JSON.stringify({ upgrades, coins: total, best: nb }),
              )
            } catch {
              /* ignore */
            }
            return nb
          })
          return total
        })
      },
    )
    engineRef.current = engine
    engine.setUpgrades(upgrades)

    const onResize = () => engine.resize()
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep engine upgrades in sync when not mid-run
  useEffect(() => {
    if (phase !== "playing") engineRef.current?.setUpgrades(upgrades)
  }, [upgrades, phase])

  // ---- input handling ----
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rectX = () => canvas.getBoundingClientRect()

    const setTargetFromClientX = (clientX: number) => {
      const r = rectX()
      engineRef.current!.input.targetX = clientX - r.left
    }

    const pointerDown = (e: PointerEvent) => {
      if (phaseRef.current !== "playing") return
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      const eng = engineRef.current!
      setTargetFromClientX(e.clientX)
      // on phones the canvas only steers; shoot/block come from on-screen pads
      if (isMobileRef.current) return
      // right button or two-finger -> block, else shoot
      if (e.button === 2 || e.pointerType === "pen") eng.input.block = true
      else eng.input.shoot = true
    }
    const pointerMove = (e: PointerEvent) => {
      if (phaseRef.current !== "playing") return
      setTargetFromClientX(e.clientX)
    }
    const pointerUp = (e: PointerEvent) => {
      const eng = engineRef.current
      if (!eng) return
      if (e.button === 2) eng.input.block = false
      else eng.input.shoot = false
      if (e.pointerType !== "mouse") {
        eng.input.shoot = false
        eng.input.block = false
      }
    }

    const keyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current
      if (!eng) return
      if (phaseRef.current !== "playing") return
      if (e.key === "ArrowLeft" || e.key === "a")
        eng.input.targetX = Math.max(0, eng.input.targetX - 40)
      if (e.key === "ArrowRight" || e.key === "d")
        eng.input.targetX = Math.min(eng.W, eng.input.targetX + 40)
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault()
        eng.input.shoot = true
      }
      if (e.key === "Shift" || e.key === "ArrowDown" || e.key === "s")
        eng.input.block = true
      if (e.key === "Escape") setPhase((p) => (p === "playing" ? "paused" : p))
    }
    const keyUp = (e: KeyboardEvent) => {
      const eng = engineRef.current
      if (!eng) return
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w")
        eng.input.shoot = false
      if (e.key === "Shift" || e.key === "ArrowDown" || e.key === "s")
        eng.input.block = false
    }

    const preventMenu = (e: Event) => e.preventDefault()

    canvas.addEventListener("pointerdown", pointerDown)
    canvas.addEventListener("pointermove", pointerMove)
    window.addEventListener("pointerup", pointerUp)
    canvas.addEventListener("contextmenu", preventMenu)
    window.addEventListener("keydown", keyDown)
    window.addEventListener("keyup", keyUp)

    return () => {
      canvas.removeEventListener("pointerdown", pointerDown)
      canvas.removeEventListener("pointermove", pointerMove)
      window.removeEventListener("pointerup", pointerUp)
      canvas.removeEventListener("contextmenu", preventMenu)
      window.removeEventListener("keydown", keyDown)
      window.removeEventListener("keyup", keyUp)
    }
  }, [])

  // ---- actions ----
  const startRun = useCallback(() => {
    const eng = engineRef.current
    if (!eng) return
    setShopOpen(false)
    eng.resize()
    eng.setUpgrades(upgrades)
    eng.reset()
    setStats(eng.getStats())
    setPhase("playing")
    eng.start()
  }, [upgrades])

  const togglePause = useCallback(() => {
    const eng = engineRef.current
    if (!eng) return
    if (phase === "playing") {
      eng.pause()
      setPhase("paused")
    } else if (phase === "paused") {
      setPhase("playing")
      eng.resume()
    }
  }, [phase])

  const buyUpgrade = useCallback(
    (u: Upgrade) => {
      setUpgrades((prev) => {
        const owned = prev[u.id]
        if (owned >= u.maxTier) return prev
        const cost = upgradeCost(u, owned)
        if (bankCoins < cost) return prev
        const nextUpg = { ...prev, [u.id]: owned + 1 }
        setBankCoins((c) => {
          const nc = c - cost
          try {
            localStorage.setItem(
              SAVE_KEY,
              JSON.stringify({ upgrades: nextUpg, coins: nc, best }),
            )
          } catch {
            /* ignore */
          }
          return nc
        })
        return nextUpg
      })
    },
    [bankCoins, best],
  )

  const openShopFromOver = useCallback(() => setShopOpen(true), [])

  // press-and-hold handlers for the on-screen shoot/block pads
  const holdPad = useCallback((action: "shoot" | "block") => {
    const set = (v: boolean) => {
      const eng = engineRef.current
      if (eng) eng.input[action] = v
    }
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        set(true)
      },
      onPointerUp: () => set(false),
      onPointerCancel: () => set(false),
      onPointerLeave: () => set(false),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }
  }, [])

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-background">
      {/* playfield */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="size-full touch-none select-none"
          aria-label="Game playfield"
        />

        {phase === "playing" && <Hud stats={stats} />}

        {/* desktop pause button while playing */}
        {phase === "playing" && !isMobile && (
          <button
            type="button"
            onClick={togglePause}
            aria-label="Pause"
            className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-lg border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <Pause className="size-4" />
          </button>
        )}

        {/* phone touch controls: drag playfield to steer, hold pads to act */}
        {phase === "playing" && isMobile && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              aria-label="Block (hold)"
              {...holdPad("block")}
              className="pointer-events-auto grid size-20 touch-none select-none place-items-center rounded-full border border-accent/50 bg-accent/15 text-accent backdrop-blur-sm transition-transform active:scale-95 active:bg-accent/30"
            >
              <span className="flex flex-col items-center gap-0.5">
                <Shield className="size-7" />
                <span className="font-display text-[10px] font-bold uppercase tracking-wider">
                  Block
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={togglePause}
              aria-label="Pause"
              className="pointer-events-auto mb-2 grid size-11 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground backdrop-blur-sm active:scale-95"
            >
              <Pause className="size-5" />
            </button>

            <button
              type="button"
              aria-label="Shoot (hold)"
              {...holdPad("shoot")}
              className="pointer-events-auto grid size-20 touch-none select-none place-items-center rounded-full border border-[#67e8f9]/50 bg-[#67e8f9]/15 text-[#67e8f9] backdrop-blur-sm transition-transform active:scale-95 active:bg-[#67e8f9]/30"
            >
              <span className="flex flex-col items-center gap-0.5">
                <Crosshair className="size-7" />
                <span className="font-display text-[10px] font-bold uppercase tracking-wider">
                  Shoot
                </span>
              </span>
            </button>
          </div>
        )}

        {phase === "start" && (
          <StartScreen onStart={startRun} isMobile={isMobile} />
        )}

        {phase === "paused" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5 text-center">
              <h2 className="font-display text-4xl font-black text-foreground">
                PAUSED
              </h2>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShopOpen(true)}
                  className="h-11 gap-2 font-display font-bold uppercase"
                >
                  <ShoppingCart className="size-4" /> Upgrades
                </Button>
                <Button
                  onClick={togglePause}
                  className="h-11 gap-2 font-display font-bold uppercase"
                >
                  <Play className="size-4" /> Resume
                </Button>
              </div>
              <RarityLegend />
            </div>
          </div>
        )}

        {phase === "over" && !shopOpen && (
          <GameOverScreen
            score={stats.score}
            wave={stats.wave}
            coins={bankCoins}
            discovered={stats.discovered}
            best={best}
            onShop={openShopFromOver}
            onRestart={startRun}
          />
        )}
      </div>

      {/* shop drawer */}
      {shopOpen && (
        <div className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-primary" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                Upgrades
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-lg border border-[#fbbf24]/40 bg-[#fbbf24]/10 px-3 py-1.5 font-display font-bold tabular-nums text-[#fbbf24]">
                {bankCoins.toLocaleString()} coins
              </span>
              <button
                type="button"
                onClick={() => setShopOpen(false)}
                aria-label="Close shop"
                className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <UpgradeShop state={upgrades} coins={bankCoins} onBuy={buyUpgrade} />
          </div>

          <div className="border-t border-border p-4">
            <Button
              onClick={phase === "over" ? startRun : () => setShopOpen(false)}
              className="h-12 w-full gap-2 font-display text-base font-bold uppercase tracking-wider"
            >
              <Play className="size-5" />
              {phase === "over" ? "Launch Run" : "Back"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
