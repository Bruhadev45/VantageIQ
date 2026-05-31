import { useEffect, useRef, useState } from "react";
import { BrainCircuit, CheckCircle2, Clock, Download, FileText, Loader2, Sparkles } from "lucide-react";
import type { AgentName, MarketRecommendation, MarketRequest } from "../../shared/contracts";
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
  mission: MarketRequest;
  sourcesCount: number;
  onGenerate: () => void;
  onExport: () => void;
};

export function StrategyRoom({ recommendations, stream, mission, sourcesCount, onGenerate, onExport }: Props) {
  const isRunning = stream.status === "starting" || stream.status === "streaming";
  const isDone = stream.status === "completed";
  const completedCount = AGENT_ORDER.filter((agent) => stream.agents[agent].status === "complete").length;
  const progress = Math.round((completedCount / AGENT_ORDER.length) * 100);

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      if (startRef.current === null) {
        startRef.current = Date.now();
        setElapsed(0);
      }
      const id = window.setInterval(() => {
        if (startRef.current !== null) setElapsed((Date.now() - startRef.current) / 1000);
      }, 100);
      return () => window.clearInterval(id);
    }
    if (stream.status === "idle") {
      startRef.current = null;
      setElapsed(0);
    } else {
      // completed / failed — freeze the timer at its final value
      startRef.current = null;
    }
    return undefined;
  }, [isRunning, stream.status]);

  return (
    <section className="strategy-section">
      <div className="panel-heading">
        <div>
          <span>AI Strategy Room</span>
          <h2>Recommended moves for {mission.market}</h2>
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
        <article className={`agent-stream-panel ${isDone ? "is-done" : ""} ${isRunning ? "is-running" : ""}`}>
          <div className="panel-heading compact">
            <div>
              <span>Live agents</span>
              <h3>
                <BrainCircuit size={18} />{" "}
                {isRunning ? "Your analyst team is working…" : isDone ? "Analysis complete" : `Stream · ${stream.status}`}
              </h3>
            </div>
            {stream.error ? <span className="status-pill status-failed">{stream.error}</span> : null}
          </div>

          {/* Live run telemetry — makes the agent work feel alive */}
          <div className="run-telemetry">
            <div className="run-stat">
              <Clock size={14} />
              <strong>{elapsed.toFixed(1)}s</strong>
              <span>elapsed</span>
            </div>
            <div className="run-stat">
              <BrainCircuit size={14} />
              <strong>
                {completedCount}/{AGENT_ORDER.length}
              </strong>
              <span>analysts done</span>
            </div>
            <div className="run-stat">
              <FileText size={14} />
              <strong>{sourcesCount}</strong>
              <span>sources in scope</span>
            </div>
            <div className="run-progress" aria-label={`${progress}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="agent-stream-grid">
            {AGENT_ORDER.map((agent, index) => {
              const agentState = stream.agents[agent];
              const isThinking = agentState.status === "streaming";
              return (
                <div className={`agent-card agent-${agentState.status}`} key={agent} style={{ animationDelay: `${index * 60}ms` }}>
                  <header>
                    <strong>
                      {agentState.status === "complete" ? (
                        <CheckCircle2 size={15} className="agent-check" />
                      ) : isThinking ? (
                        <Loader2 size={15} className="spin" />
                      ) : null}
                      {agent}
                    </strong>
                    <span>{AGENT_HEADLINES[agent]}</span>
                  </header>
                  <p className={isThinking && !agentState.finding ? "agent-thinking" : ""}>
                    {agentState.finding ||
                      (isThinking ? "Analyzing signals…" : agentState.status === "pending" ? "Queued" : "Awaiting tokens…")}
                    {isThinking ? <span className="cursor-caret" /> : null}
                  </p>
                  {agentState.insight?.confidence ? (
                    <footer>{agentState.insight.confidence}% confidence</footer>
                  ) : null}
                </div>
              );
            })}
          </div>

          {isDone ? (
            <div className="run-complete-banner">
              <div>
                <CheckCircle2 size={20} />
                <div>
                  <strong>Board memo ready</strong>
                  <span>
                    {stream.plays.length} prioritized plays · {sourcesCount} sources analyzed · delivered in{" "}
                    {elapsed.toFixed(1)}s
                  </span>
                </div>
              </div>
              <button type="button" className="primary-button" onClick={onExport}>
                <Download size={16} />
                Export board memo (PDF)
              </button>
            </div>
          ) : null}

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
