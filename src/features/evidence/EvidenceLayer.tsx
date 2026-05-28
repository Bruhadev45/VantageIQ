import { useState } from "react";
import { Link, Loader2, Plus, Radar } from "lucide-react";
import type { MarketSourceSummary } from "../../shared/contracts";

type Props = {
  sources: MarketSourceSummary[];
  ingesting?: boolean;
  scanning?: boolean;
  onIngestSource?: (url: string) => Promise<void>;
  onRunLiveResearch?: () => Promise<void>;
};

export function EvidenceLayer({
  sources,
  ingesting = false,
  scanning = false,
  onIngestSource,
  onRunLiveResearch,
}: Props) {
  const [url, setUrl] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || !onIngestSource) return;
    await onIngestSource(trimmed);
    setUrl("");
  };

  return (
    <section className="source-section">
      <div className="panel-heading">
        <div>
          <span>Evidence Layer</span>
          <h2>Source-backed India market data</h2>
        </div>
      </div>
      {onIngestSource ? (
        <div className="source-ingest-stack">
          <form className="source-ingest-form" onSubmit={handleSubmit}>
            <Link size={17} />
            <input
              type="url"
              placeholder="Paste a competitor article, report, campaign page, or company URL"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <button type="submit" className="primary-button" disabled={ingesting || !url.trim()}>
              {ingesting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
              Ingest source
            </button>
          </form>
          {onRunLiveResearch ? (
            <button
              type="button"
              className="ghost-button source-scan-button"
              onClick={onRunLiveResearch}
              disabled={scanning}
            >
              {scanning ? <Loader2 size={16} className="spin" /> : <Radar size={16} />}
              Run live market scan
            </button>
          ) : null}
        </div>
      ) : null}
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
