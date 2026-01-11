import type { Currency } from "../lib/types";
import Cost from "./currency/Cost";

type HeaderBarProps = {
  label: string;
  value: Currency;
};

export default function HeaderBar({ label, value }: HeaderBarProps) {
  return (
    <section className="topPanel">
      <div className="topHeader">
        <div className="brandMark" aria-label="Earth Defense Force Iron Rain Tracker">
          <div className="brandMain" data-text="EDF IRON RAIN">
            Earth Defense Force: IRON RAIN
          </div>
          <div className="brandSub" data-text="TRACKER">
            TRACKER
          </div>
        </div>

        <div className="totalLabel">{label}</div>
        <div className="totalValue">
          <Cost value={value} dense />
        </div>
      </div>
    </section>
  );
}
