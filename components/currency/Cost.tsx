import styles from "./Currency.module.scss";
import CurrencyToken from "./CurrencyToken";
import { CostProps } from "../../lib/types";


export default function Cost({ value, dense, className, variant = "global" }: CostProps) {
  const isCard = variant === "card";

  const creditsMinDigits = isCard ? 7 : 8;
  const gemMinDigits = isCard ? 5 : 6;

  return (
    <div className={`${styles.costRow} ${className ?? ""}`}>
      <CurrencyToken type="credits" value={value.credits} dense={dense} minDigits={creditsMinDigits}  />
      <CurrencyToken type="yellow" value={value.yellow} dense={dense} minDigits={gemMinDigits}  />
      <CurrencyToken type="red" value={value.red} dense={dense} minDigits={gemMinDigits}  />
      <CurrencyToken type="blue" value={value.blue} dense={dense} minDigits={gemMinDigits}  />
    </div>
  );
}
