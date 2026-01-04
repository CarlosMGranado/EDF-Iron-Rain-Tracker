import type { Currency } from "../../lib/types";
import styles from "./currency.module.scss";
import CurrencyToken from "./CurrencyToken";

type Props = {
  value: Currency;
  dense?: boolean;
  className?: string;
  variant?: "summary" | "card";
};

export default function Cost({ value, dense, className, variant = "summary" }: Props) {
  const isCard = variant === "card";

  // Your stated maximums for item cards:
  // credits up to 1 000 000 (7 digits)
  // coins up to 5 digits
  // Summary can be bigger, so it keeps the wider padding
  const creditsMinDigits = isCard ? 7 : 8;
  const gemMinDigits = isCard ? 5 : 6;

  return (
    <div className={`${styles.costRow} ${className ?? ""}`}>
      <CurrencyToken type="credits" value={value.credits} dense={dense} minDigits={creditsMinDigits} maxDigits={10} />
      <CurrencyToken type="yellow" value={value.yellow} dense={dense} minDigits={gemMinDigits} maxDigits={10} />
      <CurrencyToken type="red" value={value.red} dense={dense} minDigits={gemMinDigits} maxDigits={10} />
      <CurrencyToken type="blue" value={value.blue} dense={dense} minDigits={gemMinDigits} maxDigits={10} />
    </div>
  );
}
