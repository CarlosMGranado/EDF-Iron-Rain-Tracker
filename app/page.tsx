"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { COLLECTIONS, CATALOG, CATALOG_ID_ORDER } from "../lib/catalog";
import type { AppState, Currency, ItemStatus } from "../lib/types";
import { createEmptyState, ensureItemStatus, loadState, saveState } from "../lib/storage";
import CatalogItemCard from "../components/CatalogItemCard";
import Cost from "../components/currency/Cost";

type Category = "weapons" | "items" | "cosmetics";

function sumCurrency(a: Currency, b: Currency): Currency {
  return {
    credits: a.credits + b.credits,
    yellow: a.yellow + b.yellow,
    red: a.red + b.red,
    blue: a.blue + b.blue
  };
}

function downloadJson(filename: string, data: unknown) {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function categoryForCollectionId(id: string): Category {
  const lower = id.toLowerCase();
  if (lower.includes("cosmetics")) return "cosmetics";
  if (lower.startsWith("weapons_")) return "weapons";
  return "items";
}

function isStartingWeaponUnlock(unlock?: string): boolean {
  return (unlock ?? "").toLowerCase().includes("starting");
}

const STARTING_ITEM_IDS = new Set(CATALOG.filter((it) => isStartingWeaponUnlock(it.unlock)).map((it) => it.id));
const MIGRATION_KEY_STARTING_BOUGHT = "edfir-ir-tracker:migrated_starting_bought:v1";

// -------------------------------
// Pre indexing for speed
// -------------------------------

const CATALOG_BY_CATEGORY: Record<Category, typeof CATALOG> = {
  weapons: [],
  items: [],
  cosmetics: []
};

const CATALOG_BY_COLLECTION: Record<string, typeof CATALOG> = {};
const SEARCH_HAY_BY_ID: Record<string, string> = {};

for (const it of CATALOG) {
  const cat = categoryForCollectionId(it.collectionId);
  CATALOG_BY_CATEGORY[cat].push(it);

  if (!CATALOG_BY_COLLECTION[it.collectionId]) CATALOG_BY_COLLECTION[it.collectionId] = [];
  CATALOG_BY_COLLECTION[it.collectionId].push(it);

  SEARCH_HAY_BY_ID[it.id] = `${it.name} ${it.collectionLabel} ${it.unlock ?? ""}`.toLowerCase();
}

// Build a stable "first collection per category" based on the same order you show (sorted by label)
const COLLECTION_IDS_SORTED_BY_CATEGORY: Record<Category, string[]> = (() => {
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

function firstCollectionIdForCategory(category: Category): string {
  return COLLECTION_IDS_SORTED_BY_CATEGORY[category][0] ?? "";
}

function buildDefaultState(): AppState {
  const s = createEmptyState();
  for (const id of CATALOG_ID_ORDER) s.items[id] = STARTING_ITEM_IDS.has(id) ? 2 : 0;
  return s;
}

function isCompleteStateV2(s: AppState): boolean {
  return s?.version === 2 && typeof s.items === "object" && Object.keys(s.items).length === CATALOG_ID_ORDER.length;
}

function mergeStateWithCatalog(incoming: AppState): AppState {
  const base = buildDefaultState();
  const merged: AppState = { version: 2, items: { ...base.items, ...(incoming.items ?? {}) } };

  for (const id of CATALOG_ID_ORDER) {
    const st = ensureItemStatus(merged, id);
    merged.items[id] = st === 2 ? 2 : st === 1 ? 1 : 0;
  }

  return merged;
}

function migrateStartingWeaponsOnce(state: AppState): AppState {
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

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category>("weapons");

  // No more "all". Always a real collection id.
  const [collectionId, setCollectionId] = useState<string>(() => firstCollectionIdForCategory("weapons"));

  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const loaded = loadState();

    const base =
      loaded && Object.keys(loaded.items ?? {}).length > 0
        ? isCompleteStateV2(loaded)
          ? loaded
          : mergeStateWithCatalog(loaded)
        : buildDefaultState();

    const migrated = migrateStartingWeaponsOnce(base);
    setState(migrated);
  }, []);

  useEffect(() => {
    if (!state) return;
    saveState(state);
  }, [state]);

  // When category changes, auto select the first collection in that category.
  useEffect(() => {
    const firstId = firstCollectionIdForCategory(category);
    if (!firstId) return;

    // Only change if the current selection is not in this category
    const allowed = new Set(COLLECTION_IDS_SORTED_BY_CATEGORY[category]);
    if (!allowed.has(collectionId)) setCollectionId(firstId);
  }, [category, collectionId]);

  const collectionsInCategory = useMemo(() => {
    return COLLECTIONS.filter((c) => categoryForCollectionId(c.id) === category);
  }, [category]);

  const collectionCountsById = useMemo(() => {
    if (!state) {
      return {} as Record<
        string,
        { locked: number; unlocked: number; bought: number; total: number; label: string; icon?: string }
      >;
    }

    const out: Record<string, { locked: number; unlocked: number; bought: number; total: number; label: string; icon?: string }> = {};

    for (const c of COLLECTIONS) {
      let locked = 0;
      let unlocked = 0;
      let bought = 0;

      for (const it of c.items) {
        const st = (state.items[it.id] ?? 0) as ItemStatus;
        if (st === 2) bought += 1;
        else if (st === 1) unlocked += 1;
        else locked += 1;
      }

      out[c.id] = { locked, unlocked, bought, total: c.items.length, label: c.label, icon: (c as any).icon };
    }

    return out;
  }, [state]);

  const collectionTiles = useMemo(() => {
    return collectionsInCategory
      .map((c) => {
        const counts =
          collectionCountsById[c.id] ?? {
            locked: 0,
            unlocked: 0,
            bought: 0,
            total: c.items.length,
            label: c.label,
            icon: (c as any).icon
          };
        return { id: c.id, ...counts };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [collectionsInCategory, collectionCountsById]);

  const filteredCatalog = useMemo(() => {
    const query = q.trim().toLowerCase();

    const baseList = CATALOG_BY_COLLECTION[collectionId] ?? [];
    if (!query) return baseList;

    return baseList.filter((item) => {
      const hay = SEARCH_HAY_BY_ID[item.id] ?? "";
      return hay.includes(query);
    });
  }, [collectionId, q]);

  const stats = useMemo(() => {
    if (!state) {
      return {
        total: CATALOG.length,
        locked: 0,
        unlockedNotBought: 0,
        bought: 0,
        remainingAll: { credits: 0, yellow: 0, red: 0, blue: 0 } as Currency,
        remainingUnlocked: { credits: 0, yellow: 0, red: 0, blue: 0 } as Currency
      };
    }

    let locked = 0;
    let unlockedNotBought = 0;
    let bought = 0;

    let remainingAll: Currency = { credits: 0, yellow: 0, red: 0, blue: 0 };
    let remainingUnlocked: Currency = { credits: 0, yellow: 0, red: 0, blue: 0 };

    for (const it of CATALOG) {
      const st = ensureItemStatus(state, it.id);

      if (st === 2) {
        bought += 1;
        continue;
      }

      remainingAll = sumCurrency(remainingAll, it.cost);

      if (st === 1) {
        unlockedNotBought += 1;
        remainingUnlocked = sumCurrency(remainingUnlocked, it.cost);
      } else {
        locked += 1;
      }
    }

    const total = CATALOG.length;
    return { total, locked, unlockedNotBought, bought, remainingAll, remainingUnlocked };
  }, [state]);

  function setItemStatus(id: string, nextStatus: ItemStatus) {
    setState((prev) => {
      if (!prev) return prev;
      const next: AppState = { ...prev, items: { ...prev.items } };
      next.items[id] = nextStatus;
      return next;
    });
  }

  function toggleUnlocked(id: string) {
    if (!state) return;
    const cur = ensureItemStatus(state, id);
    if (cur === 0) return setItemStatus(id, 1);
    if (cur === 1) return setItemStatus(id, 0);
    return setItemStatus(id, 0);
  }

  function toggleBought(id: string) {
    if (!state) return;
    const cur = ensureItemStatus(state, id);
    if (cur === 2) return setItemStatus(id, 1);
    return setItemStatus(id, 2);
  }

  function resetAll() {
    if (!confirm("Reset all flags? This only clears your local progress.")) return;
    setState(buildDefaultState());
    setExportText("");
    setImportText("");
    setQ("");
    setCategory("weapons");
    setCollectionId(firstCollectionIdForCategory("weapons"));
  }

  function openImportExport() {
    dialogRef.current?.showModal();
  }

  function closeImportExport() {
    dialogRef.current?.close();
  }

  function doExport() {
    if (!state) return;
    const payload = { version: 2 as const, items: state.items };
    const text = JSON.stringify(payload, null, 2);
    setExportText(text);
    downloadJson("edfir-tracker.json", payload);
  }

  function parseIncoming(text: string): AppState {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");

    if (parsed.version === 2) {
      const items = parsed.items ?? {};
      const incoming: AppState = { version: 2, items: {} };
      for (const [id, st] of Object.entries(items)) {
        incoming.items[id] = (st === 2 || st === 1 || st === 0 ? st : 0) as ItemStatus;
      }
      return incoming;
    }

    if (parsed.version === 1) {
      const items = parsed.items ?? {};
      const incoming: AppState = { version: 2, items: {} };
      for (const [id, st] of Object.entries(items)) {
        const unlocked = Boolean((st as any)?.unlocked);
        const bought = Boolean((st as any)?.bought);
        incoming.items[id] = bought ? 2 : unlocked ? 1 : 0;
      }
      return incoming;
    }

    throw new Error(`Unsupported version: ${String(parsed.version)}`);
  }

  function doImport(text: string) {
    const incoming = parseIncoming(text);
    const merged = mergeStateWithCatalog(incoming ?? createEmptyState());
    setState(merged);
  }

  function onFilePick() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    try {
      doImport(text);
      alert("Imported.");
    } catch (e: any) {
      alert(String(e?.message ?? e));
    }
  }

  if (!state) {
    return (
      <div className="wrap">
        <div className="appShell">
          <section className="topPanel">
            <div className="topHeader">
              <div className="brandMark" aria-label="Earth Defense Force Iron Rain Tracker">
                <div className="brandMain" data-text="EDF IRON RAIN">
                  EDF: IRON RAIN
                </div>
                <div className="brandSub" data-text="TRACKER">
                  TRACKER
                </div>
              </div>
              <div className="totalLabel">Loading saved state...</div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="appShell">
        <section className="topPanel">
          <div className="topHeader">
            <div className="brandMark" aria-label="Earth Defense Force Iron Rain Tracker">
              <div className="brandMain" data-text="EDF IRON RAIN">
                EDF: IRON RAIN
              </div>
              <div className="brandSub" data-text="TRACKER">
                TRACKER
              </div>
            </div>
            <div className="totalLabel">Needed to complete:</div>
            <div className="totalValue">
              <Cost value={stats.remainingAll} dense />
            </div>
          </div>
        </section>

        <section className="bentoPanel">
          <div className="tabs">
            <button
              className={category === "weapons" ? "tab active" : "tab"}
              onClick={() => {
                setCategory("weapons");
                setCollectionId(firstCollectionIdForCategory("weapons"));
              }}
            >
              Weapons
            </button>
            <button
              className={category === "items" ? "tab active" : "tab"}
              onClick={() => {
                setCategory("items");
                setCollectionId(firstCollectionIdForCategory("items"));
              }}
            >
              Items
            </button>
            <button
              className={category === "cosmetics" ? "tab active" : "tab"}
              onClick={() => {
                setCategory("cosmetics");
                setCollectionId(firstCollectionIdForCategory("cosmetics"));
              }}
            >
              Cosmetics
            </button>
          </div>

          <div className="bentoGrid">
            {collectionTiles.map((t) => (
              <button
                key={t.id}
                className={collectionId === t.id ? "bentoTile active" : "bentoTile"}
                onClick={() => setCollectionId(t.id)}
                title={t.label}
              >
                <div className="bentoTitleRow">
                  {t.icon ? (
                    <img
                      className="bentoIcon"
                      src={t.icon}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="bentoIcon" aria-hidden="true" />
                  )}
                  <div className="bentoTitle">{t.label}</div>
                </div>
                <div className="bentoMiniBar" aria-hidden="true">
                  <span className="miniSeg bought" style={{ flexGrow: t.bought }} />
                  <span className="miniSeg unlocked" style={{ flexGrow: t.unlocked }} />
                  <span className="miniSeg locked" style={{ flexGrow: t.locked }} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="listPanel">
          <div className="itemsScroll">
            <div className="itemsGrid">
              {filteredCatalog.map((it) => {
                const st = ensureItemStatus(state, it.id);
                const flags = { unlocked: st === 1 || st === 2, bought: st === 2 };

                return (
                  <CatalogItemCard
                    key={it.id}
                    item={it}
                    state={flags}
                    rank={it.rank}
                    onToggleUnlocked={() => toggleUnlocked(it.id)}
                    onToggleBought={() => toggleBought(it.id)}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <footer className="footerBar">
          <button className="ResetButton" onClick={resetAll}>
            Reset
          </button>
          <button className="OptionsButton" onClick={openImportExport}>
            Options
          </button>
        </footer>

        <dialog ref={dialogRef} className="ioDialog">
          <div className="ioDialogInner">
            <div className="ioDialogTitle">Import Export (JSON)</div>

            <div className="row">
              <button className="primary" onClick={doExport}>
                Export JSON
              </button>
              <button onClick={onFilePick}>Import file</button>
              <button onClick={closeImportExport}>Close</button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="small">Exported JSON</div>
            <textarea value={exportText} readOnly placeholder="Export will appear here..." />

            <div className="small">Paste JSON and apply</div>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste JSON here..." />

            <div className="row">
              <button
                className="primary"
                onClick={() => {
                  try {
                    doImport(importText);
                    alert("Imported.");
                  } catch (e: any) {
                    alert(String(e?.message ?? e));
                  }
                }}
                disabled={!importText.trim()}
              >
                Apply
              </button>
              <button onClick={() => setImportText("")}>Clear</button>
            </div>
          </div>
        </dialog>
      </div>
    </div>
  );
}
