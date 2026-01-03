"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { COLLECTIONS, CATALOG, CATALOG_ID_ORDER } from "../lib/catalog";
import type { AppState, Currency, ItemFlags, ItemStatus } from "../lib/types";
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

function fmtCurrency(c: Currency): string {
  return `${c.credits.toLocaleString()}c · Y ${c.yellow} · R ${c.red} · B ${c.blue}`;
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

function buildDefaultState(): AppState {
  const s = createEmptyState();
  for (const id of CATALOG_ID_ORDER) s.items[id] = 0;
  return s;
}

const catalogById: Record<string, (typeof CATALOG)[number]> = (() => {
  const map: Record<string, (typeof CATALOG)[number]> = {};
  for (const it of CATALOG) map[it.id] = it;
  return map;
})();

function mergeStateWithCatalog(incoming: AppState): AppState {
  const base = buildDefaultState();
  const merged: AppState = { version: 2, items: { ...base.items, ...(incoming.items ?? {}) } };

  for (const id of CATALOG_ID_ORDER) {
    const st = ensureItemStatus(merged, id);
    merged.items[id] = st === 2 ? 2 : st === 1 ? 1 : 0;
  }

  return merged;
}

function statusToFlags(st: ItemStatus): ItemFlags {
  return { unlocked: st === 1 || st === 2, bought: st === 2 };
}

function categoryForCollectionId(id: string): Category {
  const lower = id.toLowerCase();
  if (lower.includes("cosmetics")) return "cosmetics";
  if (lower.startsWith("weapons_")) return "weapons";
  return "items";
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => buildDefaultState());

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category>("weapons");
  const [collectionId, setCollectionId] = useState<string>("all");

  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const loaded = loadState() ?? buildDefaultState();
    setState(mergeStateWithCatalog(loaded));
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const collectionsInCategory = useMemo(() => {
    return COLLECTIONS.filter((c) => categoryForCollectionId(c.id) === category);
  }, [category]);

  const filteredCatalog = useMemo(() => {
    const query = q.trim().toLowerCase();

    return CATALOG.filter((item) => {
      if (categoryForCollectionId(item.collectionId) !== category) return false;
      if (collectionId !== "all" && item.collectionId !== collectionId) return false;

      if (!query) return true;
      const hay = `${item.name} ${item.id} ${item.collectionLabel} ${item.unlock ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [category, collectionId, q]);

  const stats = useMemo(() => {
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
      const next: AppState = { ...prev, items: { ...prev.items } };
      next.items[id] = nextStatus;
      return next;
    });
  }

  function toggleUnlocked(id: string) {
    const cur = ensureItemStatus(state, id);
    if (cur === 0) return setItemStatus(id, 1);
    if (cur === 1) return setItemStatus(id, 0);
    return setItemStatus(id, 0);
  }

  function toggleBought(id: string) {
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
    setCollectionId("all");
  }

  function openImportExport() {
    dialogRef.current?.showModal();
  }

  function closeImportExport() {
    dialogRef.current?.close();
  }

  function doExport() {
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
    setState(mergeStateWithCatalog(incoming ?? createEmptyState()));
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

  const collectionTiles = useMemo(() => {
    const tiles = collectionsInCategory.map((c) => {
      const ids = c.items.map((x) => x.id);

      let locked = 0;
      let unlocked = 0;
      let bought = 0;

      for (const id of ids) {
        const st = ensureItemStatus(state, id);
        if (st === 2) bought += 1;
        else if (st === 1) unlocked += 1;
        else locked += 1;
      }

      const icon =
        (typeof (c as any).icon === "string" && (c as any).icon.trim() ? (c as any).icon : null) ??
        ids
          .map((id) => (catalogById[id] as any)?.icon as string | undefined)
          .find((x) => typeof x === "string" && x.trim()) ??
        null;

      return { id: c.id, label: c.label, locked, unlocked, bought, total: ids.length, icon: c.icon };
    });

    return tiles.sort((a, b) => a.label.localeCompare(b.label));
  }, [collectionsInCategory, state]);

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
                setCollectionId("all");
              }}
            >
              Weapons
            </button>
            <button
              className={category === "items" ? "tab active" : "tab"}
              onClick={() => {
                setCategory("items");
                setCollectionId("all");
              }}
            >
              Items
            </button>
            <button
              className={category === "cosmetics" ? "tab active" : "tab"}
              onClick={() => {
                setCategory("cosmetics");
                setCollectionId("all");
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
                const flags = statusToFlags(st);

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
