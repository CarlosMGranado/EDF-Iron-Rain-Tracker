import styles from "./currency.module.scss";
import { buildGroupedNumberParts } from "../../lib/currencyFormat";

type Props = {
  value: number;
  minDigits?: number;
  maxDigits?: number;
  padToMinDigits?: boolean;
  muteLeadingZeros?: boolean;
  className?: string;
};

export default function PaddedNumber({
  value,    
  minDigits = 6,
  maxDigits = 10,
  padToMinDigits = true,
  muteLeadingZeros = true,
  className
}: Props) {
  const parts = buildGroupedNumberParts(value, {
    minDigits,
    maxDigits,
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
