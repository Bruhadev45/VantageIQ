import { ArrowRight, FileCheck2, Loader2, Sparkles, Users } from "lucide-react";
import type { MarketCompetitor } from "../../shared/contracts";

type Props = {
  market: string;
  competitors: MarketCompetitor[];
  sourcesCount: number;
  isRunning: boolean;
  onRun: () => void;
};

export function HeroPanel({ market, competitors, sourcesCount, isRunning, onRun }: Props) {
  const topNames = competitors.slice(0, 3).map((competitor) => competitor.name);
  const namesList =
    topNames.length > 0
      ? `${topNames.join(", ")}, and emerging challengers`
      : "the leading players and emerging challengers";

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <span className="eyebrow">AI competitive intelligence · live</span>
        <h1>
          20 hours of competitor research,<br />
          delivered in <span className="hero-accent">90 seconds</span>.
        </h1>
        <p>
          Give VantageIQ a market question. A team of four AI analysts studies {namesList} across the {market}{" "}
          race — then hands you a board-ready growth strategy, with every claim traced to a source.
        </p>

        <div className="hero-stats" role="list">
          <div role="listitem">
            <strong>20h → 90s</strong>
            <span>time to a brief</span>
          </div>
          <div role="listitem">
            <strong>
              <Users size={14} /> 4 analysts
            </strong>
            <span>research · trends · campaigns · strategy</span>
          </div>
          <div role="listitem">
            <strong>{sourcesCount} sources</strong>
            <span>tracked &amp; citable</span>
          </div>
          <div role="listitem">
            <strong>
              <FileCheck2 size={14} /> cited
            </strong>
            <span>every claim, evidence-backed</span>
          </div>
        </div>

        <button type="button" className="primary-button hero-cta" onClick={onRun} disabled={isRunning}>
          {isRunning ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
          {isRunning ? "Analysts working…" : "Run the AI analyst team"}
          {!isRunning ? <ArrowRight size={16} /> : null}
        </button>
      </div>

      <div className="signal-board" aria-label="AI signal workflow visualization">
        <div className="signal-node source">Sources</div>
        <div className="signal-node model">AI Pattern Engine</div>
        <div className="signal-node action">Growth Plays</div>
        <span className="signal-line one" />
        <span className="signal-line two" />
      </div>
    </section>
  );
}
