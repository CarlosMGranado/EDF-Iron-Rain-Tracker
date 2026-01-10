import styles from "./Currency.module.scss";
import { buildGroupedNumberParts } from "../../lib/currencyFormat";
import type { PaddedNumberProps } from "../../lib/types";


export default function PaddedNumber({
  value,    
  minDigits = 6,
  padToMinDigits = true,
  muteLeadingZeros = true,
  className
}: PaddedNumberProps) {
  const parts = buildGroupedNumberParts(value, {
    minDigits,
    padToMinDigits,
    muteLeadingZeros
  });

  return (
    <span className={`${styles.num} ${className ?? ""}`} aria-label={String(value)}>
      {parts.map((p, idx) => {
        if (p.kind === "sep") {
          return <span key={idx} className={styles.sep} aria-hidden="true" />;
        }
        return (
          <span key={idx} className={p.muted ? styles.mutedDigit : undefined}>
            {p.char}
          </span>
        );
      })}
    </span>
  );
}
