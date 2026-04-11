import type { Currency } from "../lib/types";
import Cost from "./currency/Cost";
import WeaponProgressRings from "./WeaponProgressRings";

type HeaderBarProps = {
  label: string;
  value: Currency;
  unlockedPercent: number;
  boughtPercent: number;
};

export default function HeaderBar({ label, value, unlockedPercent, boughtPercent }: HeaderBarProps) {
  return (
    <section className="topPanel">
      <div className="topHeader">
        <div className="topHeaderContent">
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

        <WeaponProgressRings unlockedPercent={unlockedPercent} boughtPercent={boughtPercent} />
      </div>
    </section>
  );
}
