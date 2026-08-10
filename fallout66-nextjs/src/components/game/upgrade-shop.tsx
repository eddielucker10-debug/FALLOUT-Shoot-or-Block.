"use client";

import * as Icons from "lucide-react";
import { Coins } from "lucide-react";
import { UPGRADES, upgradeCost, type Upgrade, type UpgradeState } from "@/lib/game/upgrades";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL = {
  offense: "Offense",
  defense: "Defense",
  utility: "Utility",
} as const;

const CATEGORY_COLOR = {
  offense: "text-[#fb7185]",
  defense: "text-accent",
  utility: "text-[#fbbf24]",
} as const;

function Tiers({ owned, max }: { owned: number; max: number }) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 w-2.5 rounded-full", i < owned ? "bg-primary" : "bg-border")}
        />
      ))}
    </div>
  );
}

function UpgradeCard({
  u,
  owned,
  coins,
  onBuy,
}: {
  u: Upgrade;
  owned: number;
  coins: number;
  onBuy: () => void;
}) {
  const maxed = owned >= u.maxTier;
  const cost = maxed ? 0 : upgradeCost(u, owned);
  const affordable = !maxed && coins >= cost;
  const Icon = (Icons[u.icon as keyof typeof Icons] ?? Icons.Circle) as Icons.LucideIcon;
  const current = u.value(owned);
  const next = maxed ? current : u.value(owned + 1);

  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={!affordable}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border p-3 text-left transition-all",
        maxed
          ? "border-primary/50 bg-primary/10"
          : affordable
            ? "border-border bg-card hover:border-primary hover:bg-primary/10"
            : "border-border/50 bg-card/40 opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg bg-secondary",
              CATEGORY_COLOR[u.category],
            )}
          >
            <Icon className="size-4" />
          </span>
          <div>
            <div className="font-display text-sm font-bold leading-tight text-foreground">
              {u.name}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tier {owned}/{u.maxTier}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs leading-snug text-muted-foreground">{u.desc}</p>

      <Tiers owned={owned} max={u.maxTier} />

      <div className="flex items-center justify-between">
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {u.format(current)}
          {!maxed && (
            <>
              {" → "}
              <span className="text-accent">{u.format(next)}</span>
            </>
          )}
        </span>
        {maxed ? (
          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-primary">
            MAX
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-0.5 font-display text-xs font-bold tabular-nums",
              affordable ? "bg-[#fbbf24]/15 text-[#fbbf24]" : "bg-secondary text-muted-foreground",
            )}
          >
            <Coins className="size-3" />
            {cost}
          </span>
        )}
      </div>
    </button>
  );
}

export function UpgradeShop({
  state,
  coins,
  onBuy,
}: {
  state: UpgradeState;
  coins: number;
  onBuy: (u: Upgrade) => void;
}) {
  const cats = ["offense", "defense", "utility"] as const;
  return (
    <div className="flex flex-col gap-4">
      {cats.map((cat) => (
        <div key={cat}>
          <h3
            className={cn(
              "mb-2 font-display text-xs font-bold uppercase tracking-widest",
              CATEGORY_COLOR[cat],
            )}
          >
            {CATEGORY_LABEL[cat]}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {UPGRADES.filter((u) => u.category === cat).map((u) => (
              <UpgradeCard
                key={u.id}
                u={u}
                owned={state[u.id]}
                coins={coins}
                onBuy={() => onBuy(u)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
