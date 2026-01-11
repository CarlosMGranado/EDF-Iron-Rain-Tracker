import type { Category, SortBy, UnlockDifficulty } from "./types";
import { CATALOG, CATALOG_ID_ORDER, COLLECTIONS } from "./catalog";

export function categoryForCollectionId(id: string): Category {
  const lower = id.toLowerCase();
  if (lower.includes("cosmetics")) return "cosmetics";
  if (lower.startsWith("weapons_")) return "weapons";
  return "items";
}

export function categoryLabel(category: Category): string {
  if (category === "weapons") return "Weapons";
  if (category === "items") return "Items";
  return "Cosmetics";
}

export function isStartingWeaponUnlock(unlock?: string): boolean {
  return (unlock ?? "").toLowerCase().includes("starting");
}

function normalizeDifficulty(raw: string): UnlockDifficulty {
  const t = raw.trim().toLowerCase();
  if (t === "easy") return "easy";
  if (t === "normal") return "normal";
  if (t === "hard") return "hard";
  if (t === "hardest") return "hardest";
  if (t === "disaster") return "disaster";
  return "unknown";
}

export function parseMissionUnlock(text?: string): { mission: number; difficulty: UnlockDifficulty } | null {
  const s = (text ?? "").trim();
  if (!s) return null;

  if (isStartingWeaponUnlock(s)) return { mission: 0, difficulty: "easy" };

  const m = s.match(/m\s*(\d+)\s*\(([^)]+)\)/i);
  if (!m) return null;

  const mission = Number(m[1]);
  if (!Number.isFinite(mission)) return null;

  return { mission, difficulty: normalizeDifficulty(m[2]) };
}

const DIFFICULTY_WEIGHT: Record<UnlockDifficulty, number> = {
  easy: 0,
  normal: 1,
  hard: 2,
  hardest: 3,
  disaster: 4,
  unknown: 99
};

export function unlockSortValue(unlock?: string): number {
  const parsed = parseMissionUnlock(unlock);
  if (!parsed) return 9_000_000_000;
  return DIFFICULTY_WEIGHT[parsed.difficulty] * 1000 + parsed.mission;
}

export const GAME_ORDER_INDEX_BY_ID: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (let i = 0; i < CATALOG_ID_ORDER.length; i += 1) out[CATALOG_ID_ORDER[i]] = i;
  return out;
})();

export function sortMetricFor(item: (typeof CATALOG)[number], sortBy: SortBy): number {
  if (sortBy === "gameOrder") return GAME_ORDER_INDEX_BY_ID[item.id] ?? 9_000_000_000;
  if (sortBy === "credits") return item.cost.credits ?? 0;
  if (sortBy === "yellow") return item.cost.yellow ?? 0;
  if (sortBy === "red") return item.cost.red ?? 0;
  if (sortBy === "blue") return item.cost.blue ?? 0;
  return unlockSortValue(item.unlock);
}

export const CATALOG_BY_COLLECTION: Record<string, Array<(typeof CATALOG)[number]>> = {};
export const SEARCH_HAY_BY_ID: Record<string, string> = {};

for (const it of CATALOG) {
  if (!CATALOG_BY_COLLECTION[it.collectionId]) CATALOG_BY_COLLECTION[it.collectionId] = [];
  CATALOG_BY_COLLECTION[it.collectionId].push(it);
  SEARCH_HAY_BY_ID[it.id] = `${it.name} ${it.collectionLabel} ${it.unlock ?? ""}`.toLowerCase();
}

export const COLLECTION_IDS_SORTED_BY_CATEGORY: Record<Category, string[]> = (() => {
  const buckets: Record<Category, { id: string; label: string }[]> = {
    weapons: [],
    items: [],
    cosmetics: []
  };

  for (const c of COLLECTIONS) {
    const cat = categoryForCollectionId(c.id);
    buckets[cat].push({ id: c.id, label: c.label });
  }

  return {
    weapons: buckets.weapons.sort((a, b) => a.label.localeCompare(b.label)).map((x) => x.id),
    items: buckets.items.sort((a, b) => a.label.localeCompare(b.label)).map((x) => x.id),
    cosmetics: buckets.cosmetics.sort((a, b) => a.label.localeCompare(b.label)).map((x) => x.id)
  };
})();

export function firstCollectionIdForCategory(category: Category): string {
  return COLLECTION_IDS_SORTED_BY_CATEGORY[category][0] ?? "";
}
