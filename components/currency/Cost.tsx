import type { Currency } from "../../lib/types";
import styles from "./currency.module.scss";
import CurrencyToken from "./CurrencyToken";

type Props = {
  value: Currency;
  dense?: boolean;
  className?: string;
};

export default function Cost({ value, dense, className }: Props) {
  return (
    <div className={`${styles.costRow} ${className ?? ""}`}>
      <CurrencyToken type="credits" value={value.credits} dense={dense} minDigits={8} />
      <CurrencyToken type="yellow" value={value.yellow} dense={dense} minDigits={6} />
      <CurrencyToken type="red" value={value.red} dense={dense} minDigits={6} />
      <CurrencyToken type="blue" value={value.blue} dense={dense} minDigits={6} />
    </div>
  );
}
