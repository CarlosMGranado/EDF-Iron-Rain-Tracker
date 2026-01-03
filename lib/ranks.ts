import type { Rank } from "./types";

export const RANK_ORDER: Rank[] = ["E", "D", "C", "B", "A", "AA"];

export function normalizeRank(value: unknown): Rank {
  if (value === "AA") return "AA";
  if (value === "A") return "A";
  if (value === "B") return "B";
  if (value === "C") return "C";
  if (value === "D") return "D";
  return "E";
}

export function rankCssClass(rank: Rank): string {
  return rank === "AA" ? "rank_AA" : `rank_${rank}`;
}
