import { ArrowDownRight, ArrowUpRight, Minus, X } from "lucide-react";
import type { MarketSourceSummary, MarketTrendPoint } from "../../shared/contracts";

type Props = {
  open: boolean;
  onClose: () => void;
  trends: MarketTrendPoint[];
  sources: MarketSourceSummary[];
};

type SignalKey = "quickCommerce" | "premiumProducts" | "festiveDemand" | "loyalty";

const SIGNALS: { key: SignalKey; label: string; keywords: string[] }[] = [
  { key: "quickCommerce", label: "Quick commerce demand", keywords: ["quick commerce", "q-commerce", "qcommerce", "delivery", "minutes", "dark store", "instant"] },
  { key: "premiumProducts", label: "Premium basket", keywords: ["premium", "basket", "aov", "beauty", "gourmet"] },
  { key: "festiveDemand", label: "Festive demand", keywords: ["festive", "festival", "seasonal", "diwali", "holiday"] },
  { key: "loyalty", label: "Loyalty & membership", keywords: ["loyalty", "membership", "subscription", "retention", "repeat"] },
];

export function TrendDriversModal({ open, onClose, trends, sources }: Props) {
  if (!open) return null;

  const latest = trends[trends.length - 1];
  const previous = trends[trends.length - 2];
  const first = trends[0];

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="drivers-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Trend drivers">
        <header className="drivers-header">
          <div>
            <span className="eyebrow">Trend Radar · Drivers</span>
            <h2>What's moving each demand signal</h2>
            <p>
              Period-over-period momentum from {first?.period ?? "start"} to {latest?.period ?? "now"}, with the
              source evidence behind each signal.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="drivers-grid">
          {SIGNALS.map((signal) => {
            const current = latest ? latest[signal.key] : 0;
            const prior = previous ? previous[signal.key] : current;
            const start = first ? first[signal.key] : current;
            const momDelta = Math.round((current - prior) * 10) / 10;
            const totalDelta = Math.round((current - start) * 10) / 10;
            const direction = momDelta > 0 ? "up" : momDelta < 0 ? "down" : "flat";
            const evidence = sources
              .filter((source) => {
                const haystack = `${source.title} ${source.notes}`.toLowerCase();
                return signal.keywords.some((keyword) => haystack.includes(keyword));
              })
              .slice(0, 3);

            return (
              <article className={`driver-card driver-${direction}`} key={signal.key}>
                <header>
                  <h3>{signal.label}</h3>
                  <span className={`driver-delta delta-${direction}`}>
                    {direction === "up" ? <ArrowUpRight size={15} /> : direction === "down" ? <ArrowDownRight size={15} /> : <Minus size={15} />}
                    {momDelta > 0 ? "+" : ""}{momDelta} MoM
                  </span>
                </header>
                <div className="driver-stats">
                  <div>
                    <span>Now</span>
                    <strong>{current}</strong>
                  </div>
                  <div>
                    <span>Since {first?.period ?? "start"}</span>
                    <strong>{totalDelta > 0 ? "+" : ""}{totalDelta}</strong>
                  </div>
                  <div>
                    <span>Momentum</span>
                    <strong>{direction === "up" ? "Accelerating" : direction === "down" ? "Cooling" : "Stable"}</strong>
                  </div>
                </div>
                <div className="driver-evidence">
                  <span className="driver-evidence-label">Evidence</span>
                  {evidence.length ? (
                    <ul>
                      {evidence.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            <strong>{source.publisher}</strong>
                            <span>{source.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="driver-empty">No source mentions yet — run a live market scan to gather evidence.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
