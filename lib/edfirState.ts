import type { AppState, Currency, ItemStatus } from "./types";
import { CATALOG, CATALOG_ID_ORDER } from "./catalog";
import { createEmptyState, ensureItemStatus } from "./storage";
import { isStartingWeaponUnlock } from "./edfirSorting";

export function sumCurrency(a: Currency, b: Currency): Currency {
  return {
    credits: a.credits + b.credits,
    yellow: a.yellow + b.yellow,
    red: a.red + b.red,
    blue: a.blue + b.blue
  };
}

export function getItemStatusSafe(state: AppState, id: string): ItemStatus {
  const v = state.items[id];
  return v === 0 || v === 1 || v === 2 ? v : 0;
}

export const STARTING_ITEM_IDS = new Set(CATALOG.filter((it) => isStartingWeaponUnlock(it.unlock)).map((it) => it.id));

export const MIGRATION_KEY_STARTING_BOUGHT = "edfir-ir-tracker:migrated_starting_bought:v1";

export function buildDefaultState(): AppState {
  const s = createEmptyState();
  for (const id of CATALOG_ID_ORDER) s.items[id] = STARTING_ITEM_IDS.has(id) ? 2 : 0;
  return s;
}

export function isCompleteStateV2(s: AppState): boolean {
  return s?.version === 2 && typeof s.items === "object" && Object.keys(s.items).length === CATALOG_ID_ORDER.length;
}

export function mergeStateWithCatalog(incoming: AppState): AppState {
  const base = buildDefaultState();
  const merged: AppState = { version: 2, items: { ...base.items, ...(incoming.items ?? {}) } };

  for (const id of CATALOG_ID_ORDER) {
    const st = ensureItemStatus(merged, id);
    merged.items[id] = st === 2 ? 2 : st === 1 ? 1 : 0;
  }

  return merged;
}

export function migrateStartingWeaponsOnce(state: AppState): AppState {
  if (typeof window === "undefined") return state;

  try {
    if (window.localStorage.getItem(MIGRATION_KEY_STARTING_BOUGHT) === "1") return state;

    let changed = false;
    const next: AppState = { ...state, items: { ...state.items } };

    for (const id of STARTING_ITEM_IDS) {
      if (next.items[id] === 0) {
        next.items[id] = 2;
        changed = true;
      }
    }

    window.localStorage.setItem(MIGRATION_KEY_STARTING_BOUGHT, "1");
    return changed ? next : state;
  } catch {
    return state;
  }
}
