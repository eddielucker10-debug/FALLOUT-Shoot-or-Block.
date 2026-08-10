"use client";

import { Check, Coins, Lock } from "lucide-react";
import { BULLET_SKINS, type BulletShape, type BulletSkin } from "@/lib/game/skins";
import { cn } from "@/lib/utils";

function shapePath(shape: BulletShape, s: number): string {
  switch (shape) {
    case "diamond":
      return `M0,${-s * 2.2} L${s * 1.1},0 L0,${s * 2.2} L${-s * 1.1},0 Z`;
    case "star": {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s * 2.2 : s * 0.9;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
      }
      return `M${pts.join(" L")} Z`;
    }
    case "arrow":
      return `M0,${-s * 2.6} L${s * 1.3},${s * 1.2} L0,${s * 0.4} L${-s * 1.3},${s * 1.2} Z`;
    case "cross":
      return `M${-s * 0.45},${-s * 2.4} h${s * 0.9} v${s * 1.95} h${s * 1.35} v${s * 0.9} h${-s * 1.35} v${s * 1.95} h${-s * 0.9} v${-s * 1.95} h${-s * 1.35} v${-s * 0.9} h${s * 1.35} Z`;
    case "blade":
      return `M0,${-s * 3} Q${s * 1.4},${-s * 0.5} 0,${s * 2.4} Q${-s * 1.4},${-s * 0.5} 0,${-s * 3} Z`;
    case "bolt":
    default:
      return "";
  }
}

function BulletPreview({ skin }: { skin: BulletSkin }) {
  const s = 4;
  const glowFilter = `drop-shadow(0 0 5px ${skin.glow})`;
  const path = shapePath(skin.shape, s);

  return (
    <svg
      viewBox="-20 -26 40 52"
      className="h-14 w-10"
      role="img"
      aria-label={`${skin.name} projectile`}
    >
      {/* trail */}
      {skin.trail === "streak" && (
        <line
          x1="0"
          y1="6"
          x2="0"
          y2="24"
          stroke={skin.glow}
          strokeWidth={s * 1.2}
          strokeLinecap="round"
          opacity={0.5}
        />
      )}
      {skin.trail === "comet" &&
        [1, 2, 3, 4].map((t) => (
          <circle
            key={t}
            cx="0"
            cy={s * 2.2 * t + 4}
            r={s * (1 - t * 0.18)}
            fill={skin.glow}
            opacity={0.35 / t}
          />
        ))}
      {skin.trail === "sparks" &&
        [1, 2, 3, 4, 5].map((t) => (
          <circle
            key={t}
            cx={((t % 2 === 0 ? 1 : -1) * s * t) / 2}
            cy={s * 2.4 * t + 2}
            r={Math.max(0.8, s * 0.3)}
            fill={skin.core}
            opacity={0.55 / t}
          />
        ))}
      {skin.trail === "smoke" &&
        [1, 2, 3].map((t) => (
          <circle
            key={t}
            cx="0"
            cy={s * 3 * t + 2}
            r={s * (1 + t * 0.35)}
            fill={skin.glow}
            opacity={0.2 / t}
          />
        ))}

      {/* core */}
      <g style={{ filter: glowFilter }}>
        {skin.shape === "orb" && <circle cx="0" cy="0" r={s * 1.35} fill={skin.core} />}
        {skin.shape === "bolt" && <ellipse cx="0" cy="0" rx={s} ry={s * 1.8} fill={skin.core} />}
        {skin.shape === "beam" && (
          <rect x={-s * 0.5} y={-s * 4} width={s} height={s * 8} rx={s * 0.5} fill={skin.core} />
        )}
        {skin.shape === "ring" && (
          <>
            <circle
              cx="0"
              cy="0"
              r={s * 1.5}
              fill="none"
              stroke={skin.core}
              strokeWidth={Math.max(1.2, s * 0.55)}
            />
            <circle cx="0" cy="0" r={s * 0.45} fill={skin.core} opacity={0.7} />
          </>
        )}
        {skin.shape === "spark" && (
          <g stroke={skin.core} strokeWidth={Math.max(1, s * 0.5)} strokeLinecap="round">
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2={(Math.cos(a) * s * 2).toFixed(2)}
                  y2={(Math.sin(a) * s * 2).toFixed(2)}
                />
              );
            })}
          </g>
        )}
        {path && <path d={path} fill={skin.core} />}
      </g>
    </svg>
  );
}

function BulletCard({
  skin,
  owned,
  equipped,
  coins,
  onBuy,
  onEquip,
}: {
  skin: BulletSkin;
  owned: boolean;
  equipped: boolean;
  coins: number;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const canBuy = !owned && coins >= skin.cost;

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
        <BulletPreview skin={skin} />
      </div>

      <div className="font-display text-sm font-bold leading-tight text-foreground">
        {skin.name}
      </div>
      <div className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
        {skin.shape} · {skin.trail === "none" ? "no trail" : skin.trail}
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

export function BulletShop({
  owned,
  equipped,
  coins,
  onBuy,
  onEquip,
}: {
  owned: string[];
  equipped: string;
  coins: number;
  onBuy: (s: BulletSkin) => void;
  onEquip: (s: BulletSkin) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {BULLET_SKINS.map((skin) => (
        <BulletCard
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
