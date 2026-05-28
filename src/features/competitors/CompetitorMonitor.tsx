import type { MarketCompetitor } from "../../shared/contracts";

const formatSigned = (value: number) => `+${value}%`;

function CompetitorRow({ competitor }: { competitor: MarketCompetitor }) {
  return (
    <article className="competitor-row">
      <div className="company-lockup">
        <span>{competitor.name.slice(0, 2)}</span>
        <div>
          <strong>{competitor.name}</strong>
          <p>{competitor.category}</p>
        </div>
      </div>
      <div className="progress-stack">
        <div>
          <span>Growth</span>
          <strong>{formatSigned(competitor.growth)}</strong>
        </div>
        <progress value={Math.min(competitor.growth, 200)} max={200} />
      </div>
      <div className="progress-stack">
        <div>
          <span>Engagement</span>
          <strong>{competitor.engagement}</strong>
        </div>
        <progress value={competitor.engagement} max={100} />
      </div>
      <div className={`risk-pill ${competitor.risk.toLowerCase()}`}>{competitor.risk} threat</div>
    </article>
  );
}

type Props = {
  competitors: MarketCompetitor[];
  searchQuery: string;
  onAddCompetitor: () => void;
};

export function CompetitorMonitor({ competitors, searchQuery, onAddCompetitor }: Props) {
  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? competitors.filter(
        (competitor) =>
          competitor.name.toLowerCase().includes(query) || competitor.category.toLowerCase().includes(query),
      )
    : competitors;

  return (
    <article className="panel table-panel">
      <div className="panel-heading">
        <div>
          <span>Competitor Monitor</span>
          <h2>Where rivals are gaining ground</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onAddCompetitor}>
          Add competitor
        </button>
      </div>
      <div className="competitor-list">
        {filtered.length === 0 ? (
          <p className="empty-state">No competitors match "{searchQuery}".</p>
        ) : (
          filtered.map((competitor) => <CompetitorRow competitor={competitor} key={competitor.id} />)
        )}
      </div>
    </article>
  );
}
