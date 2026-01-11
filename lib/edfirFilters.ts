import type { FiltersState, SortBy, SortDir } from "./types";

export const FILTERS_STORAGE_KEYS = ["edfir-ir-tracker:filters:v1", "edfir-ir-tracker:filters", "filters"];

export const DEFAULT_FILTERS: FiltersState = {
  showLocked: true,
  showUnlocked: true,
  showBought: true,
  sortBy: "unlockLevel",
  sortDir: "asc"
};

function isSortBy(v: unknown): v is SortBy {
  return v === "gameOrder" || v === "credits" || v === "yellow" || v === "red" || v === "blue" || v === "unlockLevel";
}

function isSortDir(v: unknown): v is SortDir {
  return v === "asc" || v === "desc";
}

export function loadFiltersFromStorage(): FiltersState | null {
  if (typeof window === "undefined") return null;

  for (const key of FILTERS_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") continue;

      const obj = parsed as Record<string, unknown>;

      const next: FiltersState = {
        showLocked: typeof obj.showLocked === "boolean" ? obj.showLocked : DEFAULT_FILTERS.showLocked,
        showUnlocked: typeof obj.showUnlocked === "boolean" ? obj.showUnlocked : DEFAULT_FILTERS.showUnlocked,
        showBought: typeof obj.showBought === "boolean" ? obj.showBought : DEFAULT_FILTERS.showBought,
        sortBy: isSortBy(obj.sortBy) ? obj.sortBy : DEFAULT_FILTERS.sortBy,
        sortDir: isSortDir(obj.sortDir) ? obj.sortDir : DEFAULT_FILTERS.sortDir
      };

      return next;
    } catch {
      // try next key
    }
  }

  return null;
}

export function saveFiltersToStorage(filters: FiltersState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FILTERS_STORAGE_KEYS[0], JSON.stringify(filters));
  } catch {
    // ignore
  }
}
