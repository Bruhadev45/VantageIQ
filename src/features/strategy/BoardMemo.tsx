import { FileText, Flag, ShieldAlert, Sparkles, Target } from "lucide-react";
import type { AgentRunResult, MarketDatasetResponse, MarketRequest } from "../../shared/contracts";
import type { MarketBrief } from "../../services/intelligenceEngine";

type Props = {
  brief: MarketBrief;
  dataset: MarketDatasetResponse;
  mission: MarketRequest;
  runResult: AgentRunResult | null;
};

export function BoardMemo({ brief, dataset, mission, runResult }: Props) {
  const topCompetitor = [...dataset.competitors].sort((a, b) => b.growth - a.growth)[0];
  const topCampaign = dataset.campaigns[0];
  const plays = runResult?.plays.length ? runResult.plays : dataset.recommendations.slice(0, 4);
  const evidence = dataset.sources.slice(0, 3);

  return (
    <section className="board-memo">
      <div className="panel-heading">
        <div>
          <span>Board Memo</span>
          <h2>Decision brief for {mission.company}</h2>
        </div>
        <div className="memo-date">{new Date(brief.generatedAt).toLocaleDateString()}</div>
      </div>

      <div className="memo-grid">
        <article className="memo-hero">
          <div className="memo-icon">
            <FileText size={20} />
          </div>
          <h3>Executive thesis</h3>
          <p>{runResult?.executiveSummary || brief.summary}</p>
        </article>

        <article>
          <div className="memo-icon">
            <Flag size={20} />
          </div>
          <h3>Why rivals are winning</h3>
          <p>
            {topCompetitor
              ? `${topCompetitor.name} is the urgency benchmark with ${topCompetitor.growth}% growth, ${topCompetitor.marketShare}% share, and a moat around ${topCompetitor.moat.toLowerCase()}.`
              : "Competitor performance is not loaded yet."}
          </p>
        </article>

        <article>
          <div className="memo-icon">
            <Sparkles size={20} />
          </div>
          <h3>Campaign pattern to copy</h3>
          <p>
            {topCampaign
              ? `${topCampaign.brand}'s "${topCampaign.name}" pattern works because ${topCampaign.whyItWorked.toLowerCase()}`
              : "Campaign evidence is not loaded yet."}
          </p>
        </article>

        <article>
          <div className="memo-icon">
            <ShieldAlert size={20} />
          </div>
          <h3>Risks to control</h3>
          <p>
            Keep discounting tied to city-level contribution margin, repeat rate, delivery SLA, fill rate, and premium
            basket expansion. Growth without unit economics will weaken the story.
          </p>
        </article>
      </div>

      <div className="memo-playbook">
        <div>
          <h3>
            <Target size={18} />
            {mission.horizon} action plan
          </h3>
          <ul>
            {plays.map((play) => (
              <li key={play.title}>
                <strong>{play.title}</strong>
                <p>{play.action}</p>
              </li>
            ))}
          </ul>
        </div>
        <aside>
          <h3>Evidence cited</h3>
          {evidence.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              <strong>{source.publisher}</strong>
              <span>{source.title}</span>
            </a>
          ))}
        </aside>
      </div>
    </section>
  );
}
