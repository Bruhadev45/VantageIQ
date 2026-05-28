import type { AgentRunResult } from "../../shared/contracts";
import type { MarketBrief } from "../../services/intelligenceEngine";

type Props = {
  brief: MarketBrief;
  runResult: AgentRunResult | null;
};

export function ExecutiveNarrative({ brief, runResult }: Props) {
  const summary = runResult?.executiveSummary || brief.summary;
  const supporting = runResult?.insights.map((insight) => insight.finding) ?? brief.growthExplanation;

  return (
    <article className="panel narrative-panel">
      <div className="panel-heading">
        <div>
          <span>Executive Narrative</span>
          <h2>Why some companies are pulling ahead</h2>
        </div>
        {runResult ? <span className={`status-pill status-${runResult.mode}`}>{runResult.mode}</span> : null}
      </div>
      <div className="narrative-grid">
        <p>{summary}</p>
        {supporting.slice(0, 2).map((point) => (
          <p key={point}>{point}</p>
        ))}
      </div>
    </article>
  );
}
