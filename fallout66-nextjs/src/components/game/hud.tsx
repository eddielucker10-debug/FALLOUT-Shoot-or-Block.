"use client";

import { Coins, Heart, Shield, Swords, Sparkles } from "lucide-react";
import type { GameStats } from "@/lib/game/engine";
import { TOTAL_TYPES } from "@/lib/game/objects";

function Bar({
  value,
  max,
  color,
  track,
}: {
  value: number;
  max: number;
  color: string;
  track: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: track }}>
      <div
        className="h-full rounded-full transition-[width] duration-150"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function Hud({ stats }: { stats: GameStats }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        {/* top row: score / wave / coins */}
        <div className="flex items-center justify-between gap-2 font-display">
          <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Score
            </span>
            <div className="text-lg font-bold leading-none text-foreground tabular-nums">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/15 px-3 py-1.5 backdrop-blur-sm">
            <Swords className="size-4 text-primary" />
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-primary/80">Wave</span>
              <div className="text-lg font-bold leading-none text-primary tabular-nums">
                {stats.wave}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-3 py-1.5 backdrop-blur-sm">
            <Coins className="size-4 text-[#fbbf24]" />
            <div className="text-lg font-bold leading-none text-[#fbbf24] tabular-nums">
              {stats.coins.toLocaleString()}
            </div>
          </div>
        </div>

        {/* bars */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/60 bg-card/60 px-3 py-2 backdrop-blur-sm">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-destructive">
                <Heart className="size-3.5" /> Hull
              </span>
              <span className="tabular-nums text-muted-foreground">
                {stats.hp}/{stats.maxHp}
              </span>
            </div>
            <Bar
              value={stats.hp}
              max={stats.maxHp}
              color="oklch(0.68 0.2 20)"
              track="oklch(0.3 0.05 20)"
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-card/60 px-3 py-2 backdrop-blur-sm">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-accent">
                <Shield className="size-3.5" /> {stats.shieldReady ? "Shield" : "Recharging"}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {stats.shield}/{stats.maxShield}
              </span>
            </div>
            <Bar
              value={stats.shieldReady ? stats.shield : 0}
              max={stats.maxShield}
              color="oklch(0.78 0.16 210)"
              track="oklch(0.3 0.05 210)"
            />
          </div>
        </div>

        {/* combo + discovery */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className={stats.combo > 1 ? "font-display font-bold text-[#fbbf24]" : "opacity-0"}>
            {stats.combo}x COMBO
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="size-3" />
            {stats.discovered}/{TOTAL_TYPES} discovered
          </span>
        </div>
      </div>
    </div>
  );
}
