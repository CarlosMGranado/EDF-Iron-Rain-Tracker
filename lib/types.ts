export type Rank = "E" | "D" | "C" | "B" | "A" | "AA";

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