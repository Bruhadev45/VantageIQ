import { BrainCircuit, Loader2, Sparkles } from "lucide-react";
import type { AgentName, MarketRecommendation } from "../../shared/contracts";
import type { RunStreamState } from "../../hooks/useRunStream";
import { RecommendationCard } from "./RecommendationCard";

const AGENT_ORDER: AgentName[] = ["Research", "Trend", "Campaign", "Strategy"];

const AGENT_HEADLINES: Record<AgentName, string> = {
  Research: "Who is the immediate benchmark?",
  Trend: "Which demand signals are accelerating?",
  Campaign: "Which campaign pattern should we model?",
  Strategy: "What is the recommended next move?",
};

type Props = {
  recommendations: MarketRecommendation[];
  stream: RunStreamState;
  onGenerate: () => void;
};

export function StrategyRoom({ recommendations, stream, onGenerate }: Props) {
  const isRunning = stream.status === "starting" || stream.status === "streaming";

  return (
    <section className="strategy-section">
      <div className="panel-heading">
        <div>
          <span>AI Strategy Room</span>
          <h2>Recommended moves for Indian quick commerce</h2>
        </div>
        <button type="button" className="primary-button" onClick={onGenerate} disabled={isRunning}>
          {isRunning ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
          {isRunning ? "Streaming agents..." : "Generate board brief"}
        </button>
      </div>

      <div className="recommendation-grid">
        {recommendations.map((recommendation) => (
          <RecommendationCard recommendation={recommendation} key={recommendation.id} />
        ))}
      </div>

      {stream.status !== "idle" ? (
        <article className="agent-stream-panel">
          <div className="panel-heading compact">
            <div>
              <span>Live agents</span>
              <h3>
                <BrainCircuit size={18} /> Streaming reasoning · {stream.status}
              </h3>
            </div>
            {stream.error ? <span className="status-pill status-failed">{stream.error}</span> : null}
          </div>
          <div className="agent-stream-grid">
            {AGENT_ORDER.map((agent) => {
              const agentState = stream.agents[agent];
              return (
                <div className={`agent-card agent-${agentState.status}`} key={agent}>
                  <header>
                    <strong>{agent}</strong>
                    <span>{AGENT_HEADLINES[agent]}</span>
                  </header>
                  <p>
                    {agentState.finding ||
                      (agentState.status === "pending" ? "Queued…" : "Awaiting tokens…")}
                  </p>
                  {agentState.insight?.confidence ? (
                    <footer>{agentState.insight.confidence}% confidence</footer>
                  ) : null}
                </div>
              );
            })}
          </div>

          {stream.plays.length > 0 ? (
            <div className="agent-plays">
              <h4>Recommended plays</h4>
              <ul>
                {stream.plays.map((play) => (
                  <li key={play.title}>
                    <strong>{play.title}</strong>
                    <span className={`priority-pill priority-${play.priority.toLowerCase()}`}>
                      {play.team} · {play.priority}
                    </span>
                    <p>{play.action}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
