export type Rank = "E" | "D" | "C" | "B" | "A" | "AA";
export type CurrencyType = "credits" | "yellow" | "red" | "blue";
export type SortBy = "gameOrder" | "credits" | "yellow" | "red" | "blue" | "unlockLevel";
export type SortDir = "asc" | "desc";
export type TotalsMode = "global" | "category";

export type Currency = {
  credits: number;
  yellow: number;
  red: number;
  blue: number;
};

export interface Collection {
  id: string;
  label: string;
  items: CatalogEntry[];
  icon?: string;
}

export type ItemStatus = 0 | 1 | 2;

export type ItemFlags = {
  unlocked: boolean;
  bought: boolean;
};

export type AppState = {
  version: 2;
  items: Record<string, ItemStatus>;
};

export type CatalogItem = {
  id: string;
  collectionId: string;
  collectionLabel: string;

  name: string;
  cost: Currency;
  unlock?: string;

  rank?: Rank;
};

export type CatalogEntry = CatalogItem & {
  rank: Rank;
};
export type ItemState = {
  unlocked: boolean;
  bought: boolean;
};
export type FiltersState = {
  showLocked: boolean;
  showUnlocked: boolean;
  showBought: boolean;
  sortBy: SortBy;
  sortDir: SortDir;
};
//Props
export type CostProps = {
  value: Currency;
  dense?: boolean;
  className?: string;
  variant?: "global" | "card";
};

export type PaddedNumberProps = {
  value: number;
  minDigits?: number;
  padToMinDigits?: boolean;
  muteLeadingZeros?: boolean;
  className?: string;
};

export type CurrencyProps = {
  type: CurrencyType;
  value: number;
  dense?: boolean;
  minDigits?: number;
};


export type FiltersPopupProps = {
  open: boolean;
  onClose: () => void;
  value: FiltersState;
  onChange: (next: FiltersState) => void;
};


export type OptionsPopupProps = {
  open: boolean;
  onClose: () => void;

  exportText: string;
  importText: string;

  totalsMode: TotalsMode;
  onTotalsModeChange: (mode: TotalsMode) => void;

  onExport: () => void;
  onReset: () => void;

  onImportTextChange: (next: string) => void;
  onImportApply: (text: string) => void;
  onClearImport: () => void;
};
export type CatalogItemProps = {
  item: CatalogEntry;
  state: ItemState;
  rank?: Rank;
  onToggleUnlocked: () => void;
  onToggleBought: () => void;
};