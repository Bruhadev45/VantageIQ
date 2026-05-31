import { useEffect, useMemo, useState } from "react";
import { Activity, Loader2, ShieldAlert, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { simulateScenario } from "../../services/apiClient";
import type {
  MarketRequest,
  ScenarioSimulatorRequest,
  ScenarioSimulatorResult,
} from "../../shared/contracts";

type Props = {
  mission: MarketRequest;
  competitors: string[];
};

export function ScenarioSimulator({ mission, competitors }: Props) {
  const [input, setInput] = useState<ScenarioSimulatorRequest>({
    competitor: mission.competitors[0] || competitors[0] || "Blinkit",
    budgetRange: mission.budgetRange || "Medium city launch budget",
    channel: mission.channels[0] || "App CRM",
    objective: mission.objective,
    horizon: mission.horizon,
  });
  const [result, setResult] = useState<ScenarioSimulatorResult | null>(null);
  const [loading, setLoading] = useState(false);

  const channelOptions = useMemo(
    () => Array.from(new Set([...(mission.channels.length ? mission.channels : ["App CRM"]), "Paid social", "Creator", "Pricing", "Loyalty"])),
    [mission.channels],
  );

  // Keep the simulator aligned with the current mission. Editing the mission
  // (objective, horizon, budget, competitors, channels) re-seeds the form and
  // clears any now-stale result.
  useEffect(() => {
    setInput((prev) => ({
      ...prev,
      competitor: mission.competitors[0] || competitors[0] || prev.competitor,
      budgetRange: mission.budgetRange || prev.budgetRange,
      channel: mission.channels[0] || prev.channel,
      objective: mission.objective,
      horizon: mission.horizon,
    }));
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.objective, mission.horizon, mission.budgetRange, mission.competitors.join(","), mission.channels.join(",")]);

  const update = <K extends keyof ScenarioSimulatorRequest>(key: K, value: ScenarioSimulatorRequest[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    // A changed input invalidates the previous simulation output.
    setResult(null);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const nextResult = await simulateScenario(input);
      setResult(nextResult);
    } catch (error) {
      toast.error("Scenario failed", {
        description: error instanceof Error ? error.message : "Could not simulate this move.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="panel scenario-simulator">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">Decision lab</span>
          <h2>Scenario simulator</h2>
        </div>
        <button type="button" className="primary-button compact-button" onClick={runSimulation} disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : <Activity size={16} />}
          Simulate
        </button>
      </div>

      <div className="scenario-controls">
        <label>
          Competitor
          <select value={input.competitor} onChange={(event) => update("competitor", event.target.value)}>
            {competitors.map((competitor) => (
              <option key={competitor} value={competitor}>{competitor}</option>
            ))}
          </select>
        </label>
        <label>
          Budget
          <select value={input.budgetRange} onChange={(event) => update("budgetRange", event.target.value)}>
            <option value="Low pilot budget">Low pilot budget</option>
            <option value="Medium city launch budget">Medium city launch budget</option>
            <option value="High growth budget">High growth budget</option>
            <option value="Enterprise expansion budget">Enterprise expansion budget</option>
          </select>
        </label>
        <label>
          Channel
          <select value={input.channel} onChange={(event) => update("channel", event.target.value)}>
            {channelOptions.map((channel) => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>
        </label>
        <label>
          Horizon
          <select value={input.horizon} onChange={(event) => update("horizon", event.target.value)}>
            <option value="7 days">7 days</option>
            <option value="30 days">30 days</option>
            <option value="90 days">90 days</option>
            <option value="2 quarters">2 quarters</option>
          </select>
        </label>
        <label className="scenario-objective">
          Objective
          <input
            type="text"
            value={input.objective}
            onChange={(event) => update("objective", event.target.value)}
            placeholder="e.g. Grow market share in tier-1 metros"
          />
        </label>
      </div>

      {result ? (
        <div className="scenario-output">
          <div className="scenario-scores">
            <div>
              <TrendingUp size={16} />
              <span>Upside</span>
              <strong>{result.upsideScore}</strong>
            </div>
            <div>
              <ShieldAlert size={16} />
              <span>Risk</span>
              <strong>{result.riskScore}</strong>
            </div>
            <div>
              <Activity size={16} />
              <span>Confidence</span>
              <strong>{result.confidence}</strong>
            </div>
          </div>
          <p>{result.expectedOutcome}</p>
          <dl>
            <div>
              <dt>Recommended move</dt>
              <dd>{result.recommendedMove}</dd>
            </div>
            <div>
              <dt>Likely response</dt>
              <dd>{result.likelyCompetitorResponse}</dd>
            </div>
            <div>
              <dt>Watch metrics</dt>
              <dd>{result.watchMetrics.join(", ")}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="scenario-empty">Model a response plan before spending budget or presenting a recommendation.</p>
      )}
    </article>
  );
}
