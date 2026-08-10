"use client";

import {
  MousePointer2,
  Play,
  Rocket,
  RotateCcw,
  Shield,
  ShoppingCart,
  Trophy,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RARITIES, RARITY_ORDER } from "@/lib/game/rarities";
import { TOTAL_TYPES } from "@/lib/game/objects";

export function RarityLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {RARITY_ORDER.map((id) => {
        const r = RARITIES[id];
        return (
          <span key={id} className="flex items-center gap-1.5 text-xs">
            <span
              className="size-2.5 rounded-full"
              style={{ background: r.color, boxShadow: `0 0 8px ${r.glow}` }}
            />
            <span className="text-muted-foreground">{r.name}</span>
          </span>
        );
      })}
    </div>
  );
}

export function StartScreen({
  onStart,
  onGarage,
  onAdmin,
  isMobile = false,
}: {
  onStart: () => void;
  onGarage?: () => void;
  onAdmin?: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <div>
          <h1 className="font-display text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            FALL
            <span className="text-primary" style={{ textShadow: "0 0 24px oklch(0.72 0.19 300)" }}>
              OUT
            </span>
          </h1>
          <p className="mt-2 font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Shoot or Block
          </p>
        </div>

        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Debris rains from above. Hold to <b className="text-[#67e8f9]">shoot</b> fragile targets,
          or raise your <b className="text-accent">shield</b> to block the heavy, armored ones.
          Match the right method for bonus loot, chase <b className="text-[#fbbf24]">rare drops</b>,
          and spend coins on <b className="text-primary">20 tiered upgrades</b>.
        </p>

        <div className="grid grid-cols-2 gap-3 text-left text-xs">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 flex items-center gap-1.5 font-display font-bold text-[#67e8f9]">
              <MousePointer2 className="size-3.5" /> SHOOT
            </div>
            <p className="text-muted-foreground">
              {isMobile
                ? "Hold the SHOOT pad. Best vs. small & fragile debris."
                : "Hold left-click / space. Best vs. small & fragile debris."}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 flex items-center gap-1.5 font-display font-bold text-accent">
              <Shield className="size-3.5" /> BLOCK
            </div>
            <p className="text-muted-foreground">
              {isMobile
                ? "Hold the BLOCK pad. Best vs. heavy armored debris."
                : "Hold right-click / shift. Best vs. heavy armored debris."}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {isMobile
            ? "Drag anywhere on the screen to steer your ship."
            : "Move with the mouse or arrow keys · Esc to pause."}
        </p>

        <RarityLegend />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={onStart}
            className="h-12 gap-2 px-8 font-display text-base font-bold uppercase tracking-wider"
          >
            <Play className="size-5" />
            Launch
          </Button>
          {onGarage && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onGarage}
              className="h-12 gap-2 px-6 font-display text-base font-bold uppercase tracking-wider"
            >
              <Rocket className="size-5" />
              Garage
            </Button>
          )}
          {onAdmin && (
            <Button
              size="lg"
              variant="outline"
              onClick={onAdmin}
              className="h-12 gap-2 px-6 font-display text-base font-bold uppercase tracking-wider"
            >
              <ShieldAlert className="size-5" />
              Admin
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {TOTAL_TYPES} types of debris · 6 rarities · 20 upgrades · 21 ships · 40 bullet skins
        </p>
      </div>
    </div>
  );
}

export function GameOverScreen({
  score,
  wave,
  coins,
  discovered,
  best,
  onShop,
  onRestart,
}: {
  score: number;
  wave: number;
  coins: number;
  discovered: number;
  best: number;
  onShop: () => void;
  onRestart: () => void;
}) {
  const isBest = score >= best;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-destructive">
            Hull Breached
          </p>
          <h2 className="font-display text-4xl font-black text-foreground">GAME OVER</h2>
        </div>

        {isBest && (
          <div className="flex items-center gap-2 rounded-full border border-[#fbbf24]/40 bg-[#fbbf24]/10 px-4 py-1.5 font-display text-sm font-bold text-[#fbbf24]">
            <Trophy className="size-4" /> New Best Score!
          </div>
        )}

        <div className="grid w-full grid-cols-2 gap-3">
          {[
            ["Score", score.toLocaleString()],
            ["Best", Math.max(best, score).toLocaleString()],
            ["Wave Reached", String(wave)],
            ["Discovered", `${discovered}/${TOTAL_TYPES}`],
          ].map(([label, val]) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {label}
              </div>
              <div className="font-display text-xl font-bold tabular-nums text-foreground">
                {val}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          You banked <b className="text-[#fbbf24]">{coins.toLocaleString()} coins</b> — spend them,
          then launch again.
        </p>

        <div className="flex w-full gap-3">
          <Button
            variant="secondary"
            onClick={onShop}
            className="h-11 flex-1 gap-2 font-display font-bold uppercase tracking-wide"
          >
            <ShoppingCart className="size-4" />
            Upgrades
          </Button>
          <Button
            onClick={onRestart}
            className="h-11 flex-1 gap-2 font-display font-bold uppercase tracking-wide"
          >
            <RotateCcw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
