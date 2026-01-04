"use client";

import { useEffect } from "react";

export type SortBy = "gameOrder" | "credits" | "yellow" | "red" | "blue" | "unlockLevel";
export type SortDir = "asc" | "desc";

export type FiltersState = {
  showLocked: boolean;
  showUnlocked: boolean;
  showBought: boolean;
  sortBy: SortBy;
  sortDir: SortDir;
};

type Props = {
  open: boolean;
  onClose: () => void;
  value: FiltersState;
  onChange: (next: FiltersState) => void;
};

export default function FiltersModal({ open, onClose, value, onChange }: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function onBackdropMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function toggle(key: "showLocked" | "showUnlocked" | "showBought") {
    onChange({ ...value, [key]: !value[key] });
  }

  if (!open) return null;

  return (
    <div className="modalOverlay" onMouseDown={onBackdropMouseDown} role="dialog" aria-modal="true" aria-label="Filters">
      <div className="modalPanel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalTitle">Filters</div>

        <div className="small">Visibility</div>
        <div className="modalRow">
          <button className={value.showLocked ? "primary" : ""} onClick={() => toggle("showLocked")} aria-pressed={value.showLocked}>
            {value.showLocked ? "Hide Locked":"See Locked"}
          </button>

          <button
            className={value.showUnlocked ? "primary" : ""}
            onClick={() => toggle("showUnlocked")}
            aria-pressed={value.showUnlocked}
          >
            {value.showUnlocked ? "Hide Unlocked" : "See Unlocked"}
          </button>

          <button className={value.showBought ? "primary" : ""} onClick={() => toggle("showBought")} aria-pressed={value.showBought}>
            {value.showBought ? "Hide Bought" : "See Bought"}
          </button>
        </div>

        <div className="small">Sort</div>
        <div className="modalRow">F
          <div className="modalField">
            <div className="modalFieldLabel small">Sort By</div>
            <select value={value.sortBy} onChange={(e) => onChange({ ...value, sortBy: e.target.value as SortBy })}>
              <option value="gameOrder">Game Order</option>
              <option value="credits">Price Gold</option>
              <option value="yellow">Price Yellow Gem</option>
              <option value="red">Price Red Gem</option>
              <option value="blue">Price Blue Gem</option>
              <option value="unlockLevel">Level Unlocked</option>
            </select>
          </div>

          <div className="modalField">
            <div className="modalFieldLabel small">Direction</div>
            <select value={value.sortDir} onChange={(e) => onChange({ ...value, sortDir: e.target.value as SortDir })}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <div className="modalRow">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
