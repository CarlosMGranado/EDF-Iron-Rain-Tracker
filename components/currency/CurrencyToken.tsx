import styles from "./Currency.module.scss";
import PaddedNumber from "./PaddedNumber";
import type { CurrencyType, CurrencyProps } from "../../lib/types";

function CoinIcon({ dense }: { dense?: boolean }) {
  return <span className={`${styles.coinIcon} ${dense ? styles.dense : ""}`} aria-hidden="true" />;
}

function GemIcon({ type, dense }: { type: Exclude<CurrencyType, "credits">; dense?: boolean }) {
  const cls = type === "yellow" ? styles.gemYellow : type === "red" ? styles.gemRed : styles.gemBlue;
  const label = type === "yellow" ? "Y" : type === "red" ? "R" : "B";

  return (
    <span className={`${styles.gemCircle} ${cls} ${dense ? styles.dense : ""}`} aria-hidden="true">
      {label}
    </span>
  );
}

export default function CurrencyToken({ type, value, dense, minDigits  }: CurrencyProps) {
  const isCredits = type === "credits";

  const effectiveMin = minDigits ?? (isCredits ? 10 : 7);

  return (
    <span className={`${styles.currencyToken} ${dense ? styles.dense : ""}`}>
      {isCredits ? <CoinIcon dense={dense} /> : <GemIcon type={type} dense={dense} />}

      <span className={styles.value}>
        <PaddedNumber
          value={value}
          minDigits={effectiveMin}
          padToMinDigits={true}
          muteLeadingZeros={true}
        />
      </span>
    </span>
  );
}
