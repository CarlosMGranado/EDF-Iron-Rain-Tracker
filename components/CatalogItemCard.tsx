"use client";

import type { CatalogItemProps, ItemState, Rank } from "../lib/types";
import styles from "./CatalogItemCard.module.scss";
import Cost from "./currency/Cost";

function RarityBadge({ rank }: { rank: Rank }) {
  return <span className={`${styles.rarityBadge} ${styles[`rarity${rank}`]}`}>{rank}</span>;
}

function StatePill({ state }: { state: ItemState }) {
  if (state.bought) return <span className={`${styles.statePill} ${styles.stateOwned}`}>Owned</span>;
  if (state.unlocked) return <span className={`${styles.statePill} ${styles.stateUnlocked}`}>Unlocked</span>;
  return null;
}

export default function CatalogItemCard({ item, state, rank, onToggleUnlocked, onToggleBought }: CatalogItemProps) {
  
  const cls = state.bought ? "item bought" : state.unlocked ? "item unlocked" : "item locked";

  const showUnlockCondition = !state.unlocked && !state.bought;
  const unlockText = (item.unlock ?? "").trim();

  return (
    <div className={`${cls} ${styles.card}`}>
      <div className={styles.topRow}>
        <div className={styles.titleRow}>
          {rank && <RarityBadge rank={rank} />}
          <h3 className={styles.title}>{item.name}</h3>
        </div>

        {showUnlockCondition ? (
          <span className={styles.requirementPill}>
            <span className="mono">{unlockText || "Requirement unknown"}</span>
          </span>
        ) : (
          <StatePill state={state} />
        )}
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.costWrap}>
          <Cost value={item.cost} dense variant="card" />
        </div>

        <div className={styles.actions}>
          {!state.unlocked && !state.bought ? (
            <button className={styles.actionButton} onClick={onToggleUnlocked}>
              Unlock
            </button>
          ) : null}

          {state.unlocked && !state.bought ? (
            <>
              <button className={styles.actionButton} onClick={onToggleUnlocked}>
                Lock
              </button>
              <button className={styles.actionButton} onClick={onToggleBought}>
                Buy
              </button>
            </>
          ) : null}

          {state.bought ? (
            <button className={styles.actionButton} onClick={onToggleBought}>
              Unbuy
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
