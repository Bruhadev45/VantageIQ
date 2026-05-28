import type { MarketSourceSummary } from "../../shared/contracts";

type Props = {
  sources: MarketSourceSummary[];
};

export function EvidenceLayer({ sources }: Props) {
  return (
    <section className="source-section">
      <div className="panel-heading">
        <div>
          <span>Evidence Layer</span>
          <h2>Source-backed India market data</h2>
        </div>
      </div>
      <div className="source-grid">
        {sources.length === 0 ? (
          <p className="empty-state">No sources yet — run db:seed to populate evidence.</p>
        ) : (
          sources.map((source) => (
            <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              <span>{source.publisher}</span>
              <strong>{source.title}</strong>
              <p>{source.notes}</p>
              <small>{source.date}</small>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
