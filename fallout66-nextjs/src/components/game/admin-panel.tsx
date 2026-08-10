"use client";

import { useMemo, useState } from "react";
import { KeyRound, ShieldAlert, X, Zap } from "lucide-react";
import {
  ACTION_POWERS,
  ADMIN_PASSWORD,
  POWER_GROUPS,
  TOGGLE_POWERS,
  type PowerGroup,
  type PowerToggles,
} from "@/lib/game/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === ADMIN_PASSWORD) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center"
    >
      <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
        <KeyRound className="size-6" />
      </span>
      <h2 className="font-display text-2xl font-black uppercase tracking-wide text-foreground">
        Admin Access
      </h2>
      <p className="text-sm text-muted-foreground">
        Enter the developer passcode to unlock admin powers.
      </p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        maxLength={32}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        placeholder="Passcode"
        aria-label="Admin passcode"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-center font-display tracking-[0.3em] text-foreground outline-none focus:border-primary"
      />
      {error && (
        <p className="font-display text-xs font-bold uppercase tracking-wider text-destructive">
          Access denied
        </p>
      )}
      <Button type="submit" className="w-full font-display font-bold uppercase">
        Unlock
      </Button>
    </form>
  );
}

export function AdminPanel({
  unlocked,
  onUnlock,
  toggles,
  onToggle,
  onAction,
  onResetAll,
  inRun,
  onClose,
}: {
  unlocked: boolean;
  onUnlock: () => void;
  toggles: PowerToggles;
  onToggle: (id: string) => void;
  onAction: (id: string) => void;
  onResetAll: () => void;
  inRun: boolean;
  onClose: () => void;
}) {
  const [group, setGroup] = useState<PowerGroup>("Offense");

  const activeCount = useMemo(() => Object.values(toggles).filter(Boolean).length, [toggles]);

  const groupToggles = TOGGLE_POWERS.filter((p) => p.group === group);
  const groupActions = ACTION_POWERS.filter((p) => p.group === group);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-destructive" />
          <h2 className="font-display text-lg font-black uppercase tracking-wide text-foreground">
            Admin Powers
          </h2>
          {unlocked && activeCount > 0 && (
            <span className="rounded-md bg-destructive/15 px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider text-destructive">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unlocked && (
            <button
              type="button"
              onClick={onResetAll}
              className="rounded-lg border border-border bg-card px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin panel"
            className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {!unlocked ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <PasswordGate onUnlock={onUnlock} />
        </div>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
            {POWER_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-colors",
                  group === g
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {groupToggles.map((p) => {
              const on = !!toggles[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                    on
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-bold text-foreground">
                      {p.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{p.desc}</span>
                  </span>
                  <span
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      on ? "bg-primary" : "bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-background transition-all",
                        on ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </span>
                </button>
              );
            })}

            {groupActions.map((p) => {
              const disabled = !!p.runOnly && !inRun;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAction(p.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                    disabled
                      ? "border-border/50 bg-card/40 opacity-60"
                      : "border-border bg-card hover:border-accent hover:bg-accent/10",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-bold text-foreground">
                      {p.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {disabled ? "Only available during a run" : p.desc}
                    </span>
                  </span>
                  <Zap className="size-4 shrink-0 text-accent" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
