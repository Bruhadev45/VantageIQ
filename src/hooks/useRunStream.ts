import { useCallback, useEffect, useRef, useState } from "react";
import { createRun, streamRunUrl } from "../services/apiClient";
import type {
  AgentInsight,
  AgentName,
  AgentRunResult,
  MarketRequest,
  RunDetail,
  StrategyPlay,
} from "../shared/contracts";

export type StreamingAgentState = {
  status: "pending" | "streaming" | "complete";
  finding: string;
  insight: AgentInsight | null;
};

export type RunStreamState = {
  runId: string | null;
  status: "idle" | "starting" | "streaming" | "completed" | "failed";
  error: string | null;
  agents: Record<AgentName, StreamingAgentState>;
  result: AgentRunResult | null;
  plays: StrategyPlay[];
};

const INITIAL_AGENTS: Record<AgentName, StreamingAgentState> = {
  Research: { status: "pending", finding: "", insight: null },
  Trend: { status: "pending", finding: "", insight: null },
  Campaign: { status: "pending", finding: "", insight: null },
  Strategy: { status: "pending", finding: "", insight: null },
};

export function useRunStream() {
  const [state, setState] = useState<RunStreamState>({
    runId: null,
    status: "idle",
    error: null,
    agents: { ...INITIAL_AGENTS },
    result: null,
    plays: [],
  });

  const sourceRef = useRef<EventSource | null>(null);

  const reset = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setState({
      runId: null,
      status: "idle",
      error: null,
      agents: { ...INITIAL_AGENTS },
      result: null,
      plays: [],
    });
  }, []);

  const start = useCallback(
    async (payload: MarketRequest): Promise<RunDetail | null> => {
      sourceRef.current?.close();
      sourceRef.current = null;

      setState({
        runId: null,
        status: "starting",
        error: null,
        agents: { ...INITIAL_AGENTS },
        result: null,
        plays: [],
      });

      let run: RunDetail;
      try {
        run = await createRun(payload);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: error instanceof Error ? error.message : "Failed to create run",
        }));
        return null;
      }

      const source = new EventSource(streamRunUrl(run.id));
      sourceRef.current = source;

      setState((prev) => ({ ...prev, runId: run.id, status: "streaming" }));

      source.addEventListener("agent.start", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as { agent: AgentName };
        setState((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            [data.agent]: { status: "streaming", finding: "", insight: null },
          },
        }));
      });

      source.addEventListener("agent.token", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as { agent: AgentName; delta: string };
        setState((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            [data.agent]: {
              status: "streaming",
              finding: prev.agents[data.agent].finding + data.delta,
              insight: prev.agents[data.agent].insight,
            },
          },
        }));
      });

      source.addEventListener("agent.complete", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as {
          agent: AgentName;
          insight: AgentInsight;
        };
        setState((prev) => ({
          ...prev,
          agents: {
            ...prev.agents,
            [data.agent]: {
              status: "complete",
              finding: data.insight.finding,
              insight: data.insight,
            },
          },
        }));
      });

      source.addEventListener("run.complete", (event) => {
        const data = JSON.parse((event as MessageEvent).data) as { result: AgentRunResult };
        setState((prev) => ({
          ...prev,
          status: "completed",
          result: data.result,
          plays: data.result.plays,
        }));
        source.close();
        sourceRef.current = null;
      });

      source.addEventListener("error", (event) => {
        let message = "Stream interrupted";
        if (event instanceof MessageEvent && typeof event.data === "string") {
          try {
            const parsed = JSON.parse(event.data) as { message?: string };
            if (parsed.message) message = parsed.message;
          } catch {
            // ignore parse error
          }
        }
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
        }));
        source.close();
        sourceRef.current = null;
      });

      return run;
    },
    [],
  );

  useEffect(
    () => () => {
      sourceRef.current?.close();
      sourceRef.current = null;
    },
    [],
  );

  return { state, start, reset };
}
