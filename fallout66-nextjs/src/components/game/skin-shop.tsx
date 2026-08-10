"use client";

import { Check, Coins, Lock } from "lucide-react";
import { SKINS, type Skin } from "@/lib/game/skins";
import { cn } from "@/lib/utils";

function ShipPreview({ skin }: { skin: Skin }) {
  return (
    <svg viewBox="-24 -26 48 48" className="size-14" role="img" aria-label={`${skin.name} ship`}>
      <polygon
        points="0,-20 16,12 6,6 -6,6 -16,12"
        fill={skin.body}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1}
        style={{ filter: `drop-shadow(0 0 6px ${skin.glow})` }}
      />
      <circle cx="0" cy="-4" r="4" fill={skin.cockpit} />
      <polygon points="-4,8 0,20 4,8" fill={skin.thruster} opacity={0.9} />
    </svg>
  );
}

function SkinCard({
  skin,
  owned,
  equipped,
  coins,
  onBuy,
  onEquip,
}: {
  skin: Skin;
  owned: boolean;
  equipped: boolean;
  coins: number;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const affordable = coins >= skin.cost;
  const canBuy = !owned && affordable;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
        equipped
          ? "border-primary bg-primary/10"
          : owned
            ? "border-border bg-card"
            : "border-border/50 bg-card/40",
      )}
    >
      <div
        className="grid w-full place-items-center rounded-lg py-2"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${skin.glow}22, transparent 70%)`,
        }}
      >
        <ShipPreview skin={skin} />
      </div>

      <div className="font-display text-sm font-bold leading-tight text-foreground">
        {skin.name}
      </div>

      {equipped ? (
        <span className="flex items-center gap-1 rounded-md bg-primary/20 px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-primary">
          <Check className="size-3" /> Equipped
        </span>
      ) : owned ? (
        <button
          type="button"
          onClick={onEquip}
          className="w-full rounded-md border border-border bg-secondary px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Equip
        </button>
      ) : (
        <button
          type="button"
          onClick={onBuy}
          disabled={!canBuy}
          className={cn(
            "flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 font-display text-[11px] font-bold tabular-nums transition-colors",
            canBuy
              ? "bg-[#fbbf24]/15 text-[#fbbf24] hover:bg-[#fbbf24]/25"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {canBuy ? <Coins className="size-3" /> : <Lock className="size-3" />}
          {skin.cost.toLocaleString()}
        </button>
      )}
    </div>
  );
}

export function SkinShop({
  owned,
  equipped,
  coins,
  onBuy,
  onEquip,
}: {
  owned: string[];
  equipped: string;
  coins: number;
  onBuy: (s: Skin) => void;
  onEquip: (s: Skin) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {SKINS.map((skin) => (
        <SkinCard
          key={skin.id}
          skin={skin}
          owned={owned.includes(skin.id)}
          equipped={equipped === skin.id}
          coins={coins}
          onBuy={() => onBuy(skin)}
          onEquip={() => onEquip(skin)}
        />
      ))}
    </div>
  );
}
