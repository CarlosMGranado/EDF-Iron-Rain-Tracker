"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState, Currency, ItemStatus, TotalsMode, Category } from "../lib/types";
import { CATALOG, COLLECTIONS } from "../lib/catalog";
import { createEmptyState, ensureItemStatus, loadState, saveState } from "../lib/storage";

import CatalogItemCard from "../components/CatalogItemCard";

import OptionsModal from "../components/modals/OptionsModal";
import FiltersModal from "../components/modals/FiltersModal";

import HeaderBar from "../components/HeaderBar";
import CategoryTabs from "../components/CategoryTabs";
import CollectionGrid from "../components/CollectionGrid";

import { DEFAULT_FILTERS, FILTERS_STORAGE_KEYS, loadFiltersFromStorage, saveFiltersToStorage } from "../lib/edfirFilters";
import {
  CATALOG_BY_COLLECTION,
  SEARCH_HAY_BY_ID,
  COLLECTION_IDS_SORTED_BY_CATEGORY,
  categoryForCollectionId,
  categoryLabel,
  firstCollectionIdForCategory,
  sortMetricFor,
  GAME_ORDER_INDEX_BY_ID
} from "../lib/edfirSorting";
import { buildDefaultState, isCompleteStateV2, mergeStateWithCatalog, migrateStartingWeaponsOnce, sumCurrency, getItemStatusSafe } from "../lib/edfirState";

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

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category>("weapons");
  const [collectionId, setCollectionId] = useState<string>(() => firstCollectionIdForCategory("weapons"));

  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");

  const [totalsMode, setTotalsMode] = useState<TotalsMode>("global");

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState(() => loadFiltersFromStorage() ?? DEFAULT_FILTERS);

  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

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

  useEffect(() => {
    const firstId = firstCollectionIdForCategory(category);
    if (!firstId) return;

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

    const out: Record<string, { locked: number; unlocked: number; bought: number; total: number; label: string; icon?: string }> =
      {};

    for (const c of COLLECTIONS) {
      let locked = 0;
      let unlocked = 0;
      let bought = 0;

      for (const it of c.items) {
        const st = getItemStatusSafe(state, it.id);
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

  const visibleCatalog = useMemo(() => {
    if (!state) return [];

    const query = q.trim().toLowerCase();
    const baseList = CATALOG_BY_COLLECTION[collectionId] ?? [];

    let list = !query
      ? baseList
      : baseList.filter((item) => {
          const hay = SEARCH_HAY_BY_ID[item.id] ?? "";
          return hay.includes(query);
        });

    list = list.filter((item) => {
      const st = getItemStatusSafe(state, item.id);
      if (st === 0) return filters.showLocked;
      if (st === 1) return filters.showUnlocked;
      return filters.showBought;
    });

    const dirMul = filters.sortDir === "asc" ? 1 : -1;

    return [...list].sort((a, b) => {
      const av = sortMetricFor(a, filters.sortBy);
      const bv = sortMetricFor(b, filters.sortBy);

      if (av !== bv) return (av - bv) * dirMul;

      if (filters.sortBy === "unlockLevel") {
        const nameCmp = a.name.localeCompare(b.name);
        if (nameCmp !== 0) return nameCmp;

        const ao = GAME_ORDER_INDEX_BY_ID[a.id] ?? 9_000_000_000;
        const bo = GAME_ORDER_INDEX_BY_ID[b.id] ?? 9_000_000_000;
        if (ao !== bo) return ao - bo;

        return a.id.localeCompare(b.id);
      }

      const ao = GAME_ORDER_INDEX_BY_ID[a.id] ?? 9_000_000_000;
      const bo = GAME_ORDER_INDEX_BY_ID[b.id] ?? 9_000_000_000;
      if (ao !== bo) return ao - bo;

      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;

      return a.id.localeCompare(b.id);
    });
  }, [collectionId, q, state, filters]);

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

  const remainingSelectedCategory = useMemo(() => {
    const zero: Currency = { credits: 0, yellow: 0, red: 0, blue: 0 };
    if (!state) return zero;

    let out = zero;

    for (const it of CATALOG) {
      const st = ensureItemStatus(state, it.id);
      if (st === 2) continue;

      const cat = categoryForCollectionId(it.collectionId);
      if (cat !== category) continue;

      out = sumCurrency(out, it.cost);
    }

    return out;
  }, [state, category]);

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

    setFilters(DEFAULT_FILTERS);
    try {
      window.localStorage.removeItem(FILTERS_STORAGE_KEYS[0]);
      window.localStorage.removeItem(FILTERS_STORAGE_KEYS[1]);
      window.localStorage.removeItem(FILTERS_STORAGE_KEYS[2]);
    } catch {
      // ignore
    }
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

    if ((parsed as any).version === 2) {
      const items = (parsed as any).items ?? {};
      const incoming: AppState = { version: 2, items: {} };
      for (const [id, st] of Object.entries(items)) {
        incoming.items[id] = (st === 2 || st === 1 || st === 0 ? st : 0) as ItemStatus;
      }
      return incoming;
    }

    if ((parsed as any).version === 1) {
      const items = (parsed as any).items ?? {};
      const incoming: AppState = { version: 2, items: {} };
      for (const [id, st] of Object.entries(items)) {
        const unlocked = Boolean((st as any)?.unlocked);
        const bought = Boolean((st as any)?.bought);
        incoming.items[id] = bought ? 2 : unlocked ? 1 : 0;
      }
      return incoming;
    }

    throw new Error(`Unsupported version: ${String((parsed as any).version)}`);
  }

  function doImport(text: string) {
    const incoming = parseIncoming(text);
    const merged = mergeStateWithCatalog(incoming ?? createEmptyState());
    setState(merged);
  }

  if (!state) {
    return (
      <div className="wrap">
        <div className="appShell">
          <section className="topPanel">
            <div className="topHeader">
              <div className="brandMark" aria-label="Earth Defense Force Iron Rain Tracker">
                <div className="brandMain" data-text="EDF IRON RAIN">
                  Earth Defense Force: IRON RAIN
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

  const headerLabel = totalsMode === "global" ? "Needed to complete:" : `Needed to complete (${categoryLabel(category)}):`;
  const headerValue = totalsMode === "global" ? stats.remainingAll : remainingSelectedCategory;

  return (
    <div className="wrap">
      <div className="appShell">
        <HeaderBar label={headerLabel} value={headerValue} />

        <section className="bentoPanel">
          <CategoryTabs
            value={category}
            onChange={(next) => {
              setCategory(next);
              setCollectionId(firstCollectionIdForCategory(next));
            }}
          />

          <CollectionGrid tiles={collectionTiles} selectedId={collectionId} onSelect={setCollectionId} />
        </section>

        <section className="listPanel">
          <div className="itemsScroll">
            <div className="itemsGrid">
              {visibleCatalog.map((it) => {
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
          <button className="FiltersButton" onClick={() => setFiltersOpen(true)}>
            Filters
          </button>
          <button className="OptionsButton" onClick={() => setOptionsOpen(true)}>
            Options
          </button>
        </footer>

        <OptionsModal
          open={optionsOpen}
          onClose={() => setOptionsOpen(false)}
          exportText={exportText}
          importText={importText}
          totalsMode={totalsMode}
          onTotalsModeChange={setTotalsMode}
          onExport={doExport}
          onReset={resetAll}
          onImportTextChange={setImportText}
          onImportApply={(text) => doImport(text)}
          onClearImport={() => setImportText("")}
        />

        <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} value={filters} onChange={setFilters} />
      </div>
    </div>
  );
}
