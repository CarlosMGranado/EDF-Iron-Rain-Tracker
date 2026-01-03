"use client";

import type { CatalogEntry, ItemState, Rank } from "../lib/types";
import styles from "./CatalogItemCard.module.scss";

type Props = {
  item: CatalogEntry;
  state: ItemState;
  rank?: Rank;
  onToggleUnlocked: () => void;
  onToggleBought: () => void;
};

function formatInt(n: number): string {
  return n.toLocaleString();
}

function CoinIcon() {
  return <span className={styles.coinIcon} aria-hidden="true" />;
}

function RarityBadge({ rank }: { rank: Rank }) {
  return <span className={`${styles.rarityBadge} ${styles[`rarity${rank}`]}`}>{rank}</span>;
}

function CreditsToken({ credits }: { credits: number }) {
  return (
    <span className={styles.costToken}>
      <span className="mono">{formatInt(credits)}</span>
      <CoinIcon />
    </span>
  );
}

function GemToken({
  value,
  label,
  bg
}: {
  value: number;
  label: string;
  bg: string;
}) {
  return (
    <span className={styles.costToken}>
      <span className="mono">{value}</span>
      <span className={styles.gemCircle} style={{ backgroundColor: bg }}>
        {label}
      </span>
    </span>
  );
}

export default function CatalogItemCard({
  item,
  state,
  rank,
  onToggleUnlocked,
  onToggleBought
}: Props) {
  const cls = state.bought
    ? "item bought"
    : state.unlocked
    ? "item unlocked"
    : "item locked";

  return (
    <div className={cls}>
      <div className={styles.itemTop}>
        <div>
          <div className={styles.titleRow}>
                        {rank && <RarityBadge rank={rank} />}
            <h3 className={styles.title}>{item.name}</h3>

          </div>
        </div>

        <div className="badges">
          {!state.unlocked &&         
           <span className="mono">Unlock: {item.unlock}</span>
}
          {state.unlocked && !state.bought && <span className="badge unlocked">unlocked</span>}
          {state.bought && <span className="badge bought">bought</span>}
        </div>
      </div>





      <div className={styles.costLine}>
        <span className={styles.costLabel}>COST:</span>
        <div className={styles.costTokens}>
          <CreditsToken credits={item.cost.credits} />
          <GemToken value={item.cost.yellow} label="Y" bg="#EFE139" />
          <GemToken value={item.cost.red} label="R" bg="#F32200" />
          <GemToken value={item.cost.blue} label="B" bg="#478DE4" />
        </div>
      </div>

      <div className="controls">
        <button onClick={onToggleUnlocked}>{state.unlocked ? "Lock" : "Unlock"}</button>
        <button onClick={onToggleBought}>{state.bought ? "Unbuy" : "Buy"}</button>
      </div>
    </div>
  );
}
