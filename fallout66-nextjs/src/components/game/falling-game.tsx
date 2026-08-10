"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Pause, Play, Rocket, Shield, ShieldAlert, ShoppingCart, X } from "lucide-react";
import { GameEngine, type GameStats } from "@/lib/game/engine";
import {
  initialUpgradeState,
  upgradeCost,
  type Upgrade,
  type UpgradeState,
} from "@/lib/game/upgrades";
import {
  BULLET_SKINS,
  DEFAULT_BULLET_SKIN,
  DEFAULT_SKIN,
  getBulletSkin,
  getSkin,
  SKINS,
  type BulletSkin,
  type Skin,
} from "@/lib/game/skins";
import { cheatsFromToggles, DEFAULT_CHEATS, type PowerToggles } from "@/lib/game/admin";
import { UPGRADES } from "@/lib/game/upgrades";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Hud } from "./hud";
import { UpgradeShop } from "./upgrade-shop";
import { SkinShop } from "./skin-shop";
import { BulletShop } from "./bullet-shop";
import { AdminPanel } from "./admin-panel";
import { GameOverScreen, RarityLegend, StartScreen } from "./overlays";

type Phase = "start" | "playing" | "paused" | "over";

const SAVE_KEY = "fallout:save:v1";

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
};

export function FallingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [phase, setPhase] = useState<Phase>("start");
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [upgrades, setUpgrades] = useState<UpgradeState>(initialUpgradeState());
  const [bankCoins, setBankCoins] = useState(0);
  const [best, setBest] = useState(0);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<"upgrades" | "garage">("upgrades");
  const [ownedSkins, setOwnedSkins] = useState<string[]>([DEFAULT_SKIN.id]);
  const [equippedSkin, setEquippedSkin] = useState<string>(DEFAULT_SKIN.id);
  const [garageTab, setGarageTab] = useState<"ships" | "bullets">("ships");
  const [ownedBullets, setOwnedBullets] = useState<string[]>([DEFAULT_BULLET_SKIN.id]);
  const [equippedBullet, setEquippedBullet] = useState<string>(DEFAULT_BULLET_SKIN.id);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [powerToggles, setPowerToggles] = useState<PowerToggles>({});
  const [isMobile, setIsMobile] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const isMobileRef = useRef(false);
  isMobileRef.current = isMobile;
  // keep latest skin selection available to the inline save writers
  const skinsRef = useRef({
    owned: ownedSkins,
    equipped: equippedSkin,
    ownedBullets,
    equippedBullet,
  });
  skinsRef.current = {
    owned: ownedSkins,
    equipped: equippedSkin,
    ownedBullets,
    equippedBullet,
  };

  // ---- phone detection ----
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const uaIsPhone = /Android|iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
    const compute = () => {
      const hasTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
      // phone when the UA says so, when the primary pointer is touch, or a
      // touch device on a small viewport (covers phones + small tablets)
      const mobile =
        uaIsPhone || (coarse.matches && hasTouch) || (hasTouch && window.innerWidth < 900);
      setIsMobile(mobile);
    };
    compute();
    coarse.addEventListener?.("change", compute);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      coarse.removeEventListener?.("change", compute);
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  // ---- persistence (game save state) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.upgrades) setUpgrades({ ...initialUpgradeState(), ...s.upgrades });
        if (typeof s.coins === "number") setBankCoins(s.coins);
        if (typeof s.best === "number") setBest(s.best);
        if (Array.isArray(s.ownedSkins)) {
          const owned = Array.from(new Set<string>([DEFAULT_SKIN.id, ...s.ownedSkins]));
          setOwnedSkins(owned);
        }
        if (typeof s.equippedSkin === "string") setEquippedSkin(s.equippedSkin);
        if (Array.isArray(s.ownedBullets)) {
          setOwnedBullets(Array.from(new Set<string>([DEFAULT_BULLET_SKIN.id, ...s.ownedBullets])));
        }
        if (typeof s.equippedBullet === "string") setEquippedBullet(s.equippedBullet);
      }
    } catch {
      /* ignore corrupt save */
    }
  }, []);

  const persist = useCallback(
    (next: {
      upgrades?: UpgradeState;
      coins?: number;
      best?: number;
      ownedSkins?: string[];
      equippedSkin?: string;
      ownedBullets?: string[];
      equippedBullet?: string;
    }) => {
      try {
        const cur = {
          upgrades,
          coins: bankCoins,
          best,
          ownedSkins,
          equippedSkin,
          ownedBullets,
          equippedBullet,
          ...next,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(cur));
      } catch {
        /* storage unavailable */
      }
    },
    [upgrades, bankCoins, best, ownedSkins, equippedSkin, ownedBullets, equippedBullet],
  );

  // ---- engine setup ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(
      canvas,
      (s) => setStats(s),
      () => {
        // game over
        const finalCoins = engine.coins;
        const finalScore = engine.getStats().score;
        setPhase("over");
        setBankCoins((prev) => {
          const total = prev + finalCoins;
          setBest((b) => {
            const nb = Math.max(b, finalScore);
            try {
              localStorage.setItem(
                SAVE_KEY,
                JSON.stringify({
                  upgrades,
                  coins: total,
                  best: nb,
                  ownedSkins: skinsRef.current.owned,
                  equippedSkin: skinsRef.current.equipped,
                  ownedBullets: skinsRef.current.ownedBullets,
                  equippedBullet: skinsRef.current.equippedBullet,
                }),
              );
            } catch {
              /* ignore */
            }
            return nb;
          });
          return total;
        });
      },
    );
    engineRef.current = engine;
    engine.setUpgrades(upgrades);

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep engine upgrades in sync when not mid-run
  useEffect(() => {
    if (phase !== "playing") engineRef.current?.setUpgrades(upgrades);
  }, [upgrades, phase]);

  // keep the equipped skin in sync so it shows immediately
  useEffect(() => {
    engineRef.current?.setSkin(getSkin(equippedSkin));
  }, [equippedSkin]);

  // keep the equipped bullet skin in sync
  useEffect(() => {
    engineRef.current?.setBulletSkin(getBulletSkin(equippedBullet));
  }, [equippedBullet]);

  // push admin cheats into the engine whenever a power is toggled
  useEffect(() => {
    engineRef.current?.setCheats(adminUnlocked ? cheatsFromToggles(powerToggles) : DEFAULT_CHEATS);
  }, [powerToggles, adminUnlocked]);

  // ---- input handling ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rectX = () => canvas.getBoundingClientRect();

    const setTargetFromClientX = (clientX: number) => {
      const r = rectX();
      engineRef.current!.input.targetX = clientX - r.left;
    };

    const pointerDown = (e: PointerEvent) => {
      if (phaseRef.current !== "playing") return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const eng = engineRef.current!;
      setTargetFromClientX(e.clientX);
      // on phones the canvas only steers; shoot/block come from on-screen pads
      if (isMobileRef.current) return;
      // right button or two-finger -> block, else shoot
      if (e.button === 2 || e.pointerType === "pen") eng.input.block = true;
      else eng.input.shoot = true;
    };
    const pointerMove = (e: PointerEvent) => {
      if (phaseRef.current !== "playing") return;
      setTargetFromClientX(e.clientX);
    };
    const pointerUp = (e: PointerEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.button === 2) eng.input.block = false;
      else eng.input.shoot = false;
      if (e.pointerType !== "mouse") {
        eng.input.shoot = false;
        eng.input.block = false;
      }
    };

    const keyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (phaseRef.current !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a")
        eng.input.targetX = Math.max(0, eng.input.targetX - 40);
      if (e.key === "ArrowRight" || e.key === "d")
        eng.input.targetX = Math.min(eng.W, eng.input.targetX + 40);
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        eng.input.shoot = true;
      }
      if (e.key === "Shift" || e.key === "ArrowDown" || e.key === "s") eng.input.block = true;
      if (e.key === "Escape") setPhase((p) => (p === "playing" ? "paused" : p));
    };
    const keyUp = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") eng.input.shoot = false;
      if (e.key === "Shift" || e.key === "ArrowDown" || e.key === "s") eng.input.block = false;
    };

    const preventMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("contextmenu", preventMenu);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("contextmenu", preventMenu);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  // ---- actions ----
  const startRun = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    setShopOpen(false);
    eng.resize();
    eng.setUpgrades(upgrades);
    eng.setSkin(getSkin(equippedSkin));
    eng.setBulletSkin(getBulletSkin(equippedBullet));
    eng.setCheats(adminUnlocked ? cheatsFromToggles(powerToggles) : DEFAULT_CHEATS);
    eng.reset();
    setStats(eng.getStats());
    setPhase("playing");
    eng.start();
  }, [upgrades, equippedSkin, equippedBullet, adminUnlocked, powerToggles]);

  const togglePause = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    if (phase === "playing") {
      eng.pause();
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("playing");
      eng.resume();
    }
  }, [phase]);

  const buyUpgrade = useCallback(
    (u: Upgrade) => {
      setUpgrades((prev) => {
        const owned = prev[u.id];
        if (owned >= u.maxTier) return prev;
        const cost = upgradeCost(u, owned);
        if (bankCoins < cost) return prev;
        const nextUpg = { ...prev, [u.id]: owned + 1 };
        setBankCoins((c) => {
          const nc = c - cost;
          try {
            localStorage.setItem(
              SAVE_KEY,
              JSON.stringify({
                upgrades: nextUpg,
                coins: nc,
                best,
                ownedSkins: skinsRef.current.owned,
                equippedSkin: skinsRef.current.equipped,
                ownedBullets: skinsRef.current.ownedBullets,
                equippedBullet: skinsRef.current.equippedBullet,
              }),
            );
          } catch {
            /* ignore */
          }
          return nc;
        });
        return nextUpg;
      });
    },
    [bankCoins, best],
  );

  const buySkin = useCallback(
    (skin: Skin) => {
      if (ownedSkins.includes(skin.id)) return;
      if (bankCoins < skin.cost) return;
      const nextOwned = [...ownedSkins, skin.id];
      const nextCoins = bankCoins - skin.cost;
      setOwnedSkins(nextOwned);
      setBankCoins(nextCoins);
      setEquippedSkin(skin.id);
      persist({
        coins: nextCoins,
        ownedSkins: nextOwned,
        equippedSkin: skin.id,
      });
    },
    [ownedSkins, bankCoins, persist],
  );

  const equipSkin = useCallback(
    (skin: Skin) => {
      if (!ownedSkins.includes(skin.id)) return;
      setEquippedSkin(skin.id);
      persist({ equippedSkin: skin.id });
    },
    [ownedSkins, persist],
  );

  const buyBullet = useCallback(
    (skin: BulletSkin) => {
      if (ownedBullets.includes(skin.id)) return;
      if (bankCoins < skin.cost) return;
      const nextOwned = [...ownedBullets, skin.id];
      const nextCoins = bankCoins - skin.cost;
      setOwnedBullets(nextOwned);
      setBankCoins(nextCoins);
      setEquippedBullet(skin.id);
      persist({
        coins: nextCoins,
        ownedBullets: nextOwned,
        equippedBullet: skin.id,
      });
    },
    [ownedBullets, bankCoins, persist],
  );

  const equipBullet = useCallback(
    (skin: BulletSkin) => {
      if (!ownedBullets.includes(skin.id)) return;
      setEquippedBullet(skin.id);
      persist({ equippedBullet: skin.id });
    },
    [ownedBullets, persist],
  );

  const togglePower = useCallback((id: string) => {
    setPowerToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const clearPowers = useCallback(() => setPowerToggles({}), []);

  const runAdminAction = useCallback(
    (id: string) => {
      const eng = engineRef.current;
      const addCoins = (n: number) => {
        const next = bankCoins + n;
        setBankCoins(next);
        persist({ coins: next });
      };
      const maxAll = () => {
        const next = UPGRADES.reduce<UpgradeState>(
          (acc, u) => ({ ...acc, [u.id]: u.maxTier }),
          initialUpgradeState(),
        );
        setUpgrades(next);
        persist({ upgrades: next });
        return next;
      };
      switch (id) {
        case "give1m":
          addCoins(1_000_000);
          break;
        case "give10m":
          addCoins(10_000_000);
          break;
        case "give100m":
          addCoins(100_000_000);
          break;
        case "give1b":
          addCoins(1_000_000_000);
          break;
        case "give10b":
          addCoins(10_000_000_000);
          break;
        case "give100b":
          addCoins(100_000_000_000);
          break;
        case "resetCoins":
          setBankCoins(0);
          persist({ coins: 0 });
          break;
        case "unlockShips": {
          const all = SKINS.map((s) => s.id);
          setOwnedSkins(all);
          persist({ ownedSkins: all });
          break;
        }
        case "unlockBullets": {
          const all = BULLET_SKINS.map((s) => s.id);
          setOwnedBullets(all);
          persist({ ownedBullets: all });
          break;
        }
        case "unlockEverything": {
          const ships = SKINS.map((s) => s.id);
          const bullets = BULLET_SKINS.map((s) => s.id);
          const upg = maxAll();
          setOwnedSkins(ships);
          setOwnedBullets(bullets);
          persist({ ownedSkins: ships, ownedBullets: bullets, upgrades: upg });
          break;
        }
        case "maxUpgrades":
          maxAll();
          break;
        case "resetUpgrades": {
          const fresh = initialUpgradeState();
          setUpgrades(fresh);
          persist({ upgrades: fresh });
          break;
        }
        case "resetSave": {
          try {
            localStorage.removeItem(SAVE_KEY);
          } catch {
            /* ignore */
          }
          setUpgrades(initialUpgradeState());
          setBankCoins(0);
          setBest(0);
          setOwnedSkins([DEFAULT_SKIN.id]);
          setEquippedSkin(DEFAULT_SKIN.id);
          setOwnedBullets([DEFAULT_BULLET_SKIN.id]);
          setEquippedBullet(DEFAULT_BULLET_SKIN.id);
          break;
        }
        case "fullHeal":
          eng?.adminFullHeal();
          break;
        case "fullShield":
          eng?.adminFullShield();
          break;
        case "clearScreen":
          eng?.adminClearScreen();
          break;
        case "nextWave":
          eng?.adminNextWave(1);
          break;
        case "skip5Waves":
          eng?.adminNextWave(5);
          break;
        case "maxCombo":
          eng?.adminMaxCombo();
          break;
        case "endRun":
          eng?.adminEndRun();
          setAdminOpen(false);
          break;
        default:
          break;
      }
    },
    [bankCoins, persist],
  );

  const openShopFromOver = useCallback(() => setShopOpen(true), []);

  // press-and-hold handlers for the on-screen shoot/block pads
  const holdPad = useCallback((action: "shoot" | "block") => {
    const set = (v: boolean) => {
      const eng = engineRef.current;
      if (eng) eng.input[action] = v;
    };
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        set(true);
      },
      onPointerUp: () => set(false),
      onPointerCancel: () => set(false),
      onPointerLeave: () => set(false),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
  }, []);

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
          <StartScreen
            onStart={startRun}
            onGarage={() => {
              setShopTab("garage");
              setShopOpen(true);
            }}
            onAdmin={() => setAdminOpen(true)}
            isMobile={isMobile}
          />
        )}

        {phase === "paused" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5 text-center">
              <h2 className="font-display text-4xl font-black text-foreground">PAUSED</h2>
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
                <Button
                  variant="outline"
                  onClick={() => setAdminOpen(true)}
                  className="h-11 gap-2 font-display font-bold uppercase"
                >
                  <ShieldAlert className="size-4" /> Admin
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
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setShopTab("upgrades")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide transition-colors",
                  shopTab === "upgrades"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ShoppingCart className="size-4" /> Upgrades
              </button>
              <button
                type="button"
                onClick={() => setShopTab("garage")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide transition-colors",
                  shopTab === "garage"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Rocket className="size-4" /> Garage
              </button>
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
            {shopTab === "upgrades" ? (
              <UpgradeShop state={upgrades} coins={bankCoins} onBuy={buyUpgrade} />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setGarageTab("ships")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide transition-colors",
                      garageTab === "ships"
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Ships
                  </button>
                  <button
                    type="button"
                    onClick={() => setGarageTab("bullets")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide transition-colors",
                      garageTab === "bullets"
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Bullets
                  </button>
                </div>

                {garageTab === "ships" ? (
                  <SkinShop
                    owned={ownedSkins}
                    equipped={equippedSkin}
                    coins={bankCoins}
                    onBuy={buySkin}
                    onEquip={equipSkin}
                  />
                ) : (
                  <BulletShop
                    owned={ownedBullets}
                    equipped={equippedBullet}
                    coins={bankCoins}
                    onBuy={buyBullet}
                    onEquip={equipBullet}
                  />
                )}
              </div>
            )}
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

      {/* admin panel */}
      {adminOpen && (
        <AdminPanel
          unlocked={adminUnlocked}
          onUnlock={() => setAdminUnlocked(true)}
          toggles={powerToggles}
          onToggle={togglePower}
          onAction={runAdminAction}
          onResetAll={clearPowers}
          inRun={phase === "playing" || phase === "paused"}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </div>
  );
}
