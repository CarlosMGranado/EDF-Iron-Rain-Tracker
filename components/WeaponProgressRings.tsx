type WeaponProgressRingsProps = {
  unlockedPercent: number;
  boughtPercent: number;
};

const OUTER_RADIUS = 30;
const INNER_RADIUS = 22;
const CIRCUMFERENCE_OUTER = 2 * Math.PI * OUTER_RADIUS;
const CIRCUMFERENCE_INNER = 2 * Math.PI * INNER_RADIUS;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function formatPercent(value: number): string {
  return `${clampPercent(value).toFixed(2).replace(".", ",")}%`;
}

export default function WeaponProgressRings({ unlockedPercent, boughtPercent }: WeaponProgressRingsProps) {
  const unlocked = clampPercent(unlockedPercent);
  const bought = clampPercent(boughtPercent);

  const outerOffset = CIRCUMFERENCE_OUTER * (1 - bought / 100);
  const innerOffset = CIRCUMFERENCE_INNER * (1 - unlocked / 100);

  return (
    <div className="topProgressRings" aria-label="Weapons progress">
      <svg className="progressRingsSvg" viewBox="0 0 80 80" role="img" aria-hidden="true" focusable="false">
        <circle className="ringTrack ringTrackOuter" cx="40" cy="40" r={OUTER_RADIUS} />
        <circle
          className="ringValue ringBought"
          cx="40"
          cy="40"
          r={OUTER_RADIUS}
          strokeDasharray={CIRCUMFERENCE_OUTER}
          strokeDashoffset={outerOffset}
        />

        <circle className="ringTrack ringTrackInner" cx="40" cy="40" r={INNER_RADIUS} />
        <circle
          className="ringValue ringUnlocked"
          cx="40"
          cy="40"
          r={INNER_RADIUS}
          strokeDasharray={CIRCUMFERENCE_INNER}
          strokeDashoffset={innerOffset}
        />
      </svg>
      <span className="progressRingsValue">{formatPercent(bought)}</span>
    </div>
  );
}
