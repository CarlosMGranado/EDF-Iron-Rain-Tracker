import type { AppState, ItemStatus } from "./types";

export const STORAGE_KEY = "edfir-ir-tracker:state:v2";

export function createEmptyState(): AppState {
  return { version: 2, items: {} };
}

function normalizeStatus(value: unknown): ItemStatus {
  if (value === 2 || value === 1 || value === 0) return value;
  return 0;
}

function v1ToV2(parsed: any): AppState {
  const out: AppState = { version: 2, items: {} };

  const items = parsed?.items ?? {};
  for (const [id, st] of Object.entries(items)) {
    const unlocked = Boolean((st as any)?.unlocked);
    const bought = Boolean((st as any)?.bought);
    out.items[id] = bought ? 2 : unlocked ? 1 : 0;
  }

  return out;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createEmptyState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 2 && typeof parsed?.items === "object") {
        const clean: AppState = { version: 2, items: {} };
        for (const [id, st] of Object.entries(parsed.items)) {
          clean.items[id] = normalizeStatus(st);
        }
        return clean;
      }
    }

    const legacyRaw = window.localStorage.getItem("edfir-ir-tracker:state:v1");
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy?.version === 1 && typeof legacy?.items === "object") return v1ToV2(legacy);
    }

    return createEmptyState();
  } catch {
    return createEmptyState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function ensureItemStatus(state: AppState, id: string): ItemStatus {
  const existing = state.items[id];
  if (existing === 0 || existing === 1 || existing === 2) return existing;

  state.items[id] = 0;
  return 0;
}
