import type { Currency } from "../lib/types";
import Cost from "./currency/Cost";
import WeaponProgressRings from "./WeaponProgressRings";

type HeaderBarProps = {
  label: string;
  value: Currency;
  unlockedWeaponsPercent: number;
  boughtWeaponsPercent: number;
};

export default function HeaderBar({ label, value, unlockedWeaponsPercent, boughtWeaponsPercent }: HeaderBarProps) {
  return (
    <section className="topPanel">
      <div className="topHeader">
        <WeaponProgressRings unlockedPercent={unlockedWeaponsPercent} boughtPercent={boughtWeaponsPercent} />

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
