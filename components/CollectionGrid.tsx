export type CollectionTile = {
  id: string;
  label: string;
  locked: number;
  unlocked: number;
  bought: number;
  total: number;
  icon?: string;
};

type CollectionGridProps = {
  tiles: CollectionTile[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function CollectionGrid({ tiles, selectedId, onSelect }: CollectionGridProps) {
  return (
    <div className="bentoGrid">
      {tiles.map((t) => (
        <button
          key={t.id}
          className={selectedId === t.id ? "bentoTile active" : "bentoTile"}
          onClick={() => onSelect(t.id)}
          title={t.label}
        >
          <div className="bentoTitleRow">
            {t.icon ? (
              <img
                className="bentoIcon"
                src={t.icon}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="bentoIcon" aria-hidden="true" />
            )}
            <div className="bentoTitle">{t.label}</div>
          </div>

          <div className="bentoMiniBar" aria-hidden="true">
            <span className="miniSeg bought" style={{ flexGrow: t.bought }} />
            <span className="miniSeg unlocked" style={{ flexGrow: t.unlocked }} />
            <span className="miniSeg locked" style={{ flexGrow: t.locked }} />
          </div>
        </button>
      ))}
    </div>
  );
}
