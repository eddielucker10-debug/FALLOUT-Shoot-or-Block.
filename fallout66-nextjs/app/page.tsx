import type { Metadata } from "next";
import { FallingGame } from "@/components/game/falling-game";

export const metadata: Metadata = {
  title: "FALLOUT — Shoot or Block Falling Debris",
  description:
    "Arcade survival: shoot or block 100 kinds of falling debris, chase rare drops, and stack 20 tiered upgrades.",
  openGraph: {
    title: "FALLOUT — Shoot or Block",
    description:
      "Arcade survival: blast falling debris, farm rare drops, and stack 20 tiered upgrades.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <FallingGame />
    </main>
  );
}
