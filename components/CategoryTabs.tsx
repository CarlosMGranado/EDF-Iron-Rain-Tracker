import type { Category } from "../lib/types";

type CategoryTabsProps = {
  value: Category;
  onChange: (next: Category) => void;
};

export default function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <div className="tabs">
      <button className={value === "weapons" ? "tab active" : "tab"} onClick={() => onChange("weapons")}>
        Weapons
      </button>
      <button className={value === "items" ? "tab active" : "tab"} onClick={() => onChange("items")}>
        Items
      </button>
      <button className={value === "cosmetics" ? "tab active" : "tab"} onClick={() => onChange("cosmetics")}>
        Cosmetics
      </button>
    </div>
  );
}
