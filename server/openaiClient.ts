import OpenAI from "openai";
import type {
  AgentInsight,
  AgentName,
  AgentRunResult,
  MarketRequest,
  StrategyPlay,
} from "../src/shared/contracts";
import { runCampaignAgent } from "./agents/campaignAgent";
import { runResearchAgent } from "./agents/researchAgent";
import { runDemoStrategyAgents } from "./agents/strategyAgent";
import { runTrendAgent } from "./agents/trendAgent";

export async function runOpenAIStrategyAgents(request: MarketRequest): Promise<AgentRunResult> {
  if (!process.env.OPENAI_API_KEY) {
    return runDemoStrategyAgents(request);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const demo = await runDemoStrategyAgents(request);

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      input: [
        {
          role: "system",
          content:
            "You are a senior AI business analyst. Produce concise, board-ready competitive intelligence using the supplied agent findings. Return practical sales, marketing, growth, and customer success actions.",
        },
        {
          role: "user",
          content: JSON.stringify({ request, baselineAgentFindings: demo }, null, 2),
        },
      ],
    });

    return {
      ...demo,
      mode: "live-openai",
      executiveSummary: response.output_text || demo.executiveSummary,
    };
  } catch (error) {
    console.error("OpenAI strategy generation failed; falling back to demo agents.", error);
    return demo;
  }
}

export type StreamEmitter = (event: { type: string; data: unknown }) => void;

type StreamOptions = {
  emit: StreamEmitter;
  signal?: AbortSignal;
};

async function streamAgentFinding(
  agent: AgentName,
  baseline: AgentInsight,
  request: MarketRequest,
  client: OpenAI | null,
  opts: StreamOptions,
): Promise<AgentInsight> {
  opts.emit({ type: "agent.start", data: { agent } });

  if (!client) {
    opts.emit({ type: "agent.token", data: { agent, delta: baseline.finding } });
    opts.emit({ type: "agent.complete", data: { agent, insight: baseline } });
    return baseline;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5";
  const systemPrompt = systemFor(agent);
  let accumulated = "";

  try {
    const stream = await client.responses.create({
      model,
      stream: true,
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify(
            {
              request,
              baselineFinding: baseline.finding,
              baselineEvidence: baseline.evidence,
              instruction:
                "Rewrite the baseline finding as a sharper, board-ready insight (2-3 sentences) tailored to the request. Keep it specific to the listed competitors when present.",
            },
            null,
            2,
          ),
        },
      ],
    });

    for await (const event of stream as AsyncIterable<{ type: string; delta?: string }>) {
      if (opts.signal?.aborted) break;
      if (event.type === "response.output_text.delta" && event.delta) {
        accumulated += event.delta;
        opts.emit({ type: "agent.token", data: { agent, delta: event.delta } });
      }
    }
  } catch (error) {
    console.error(`OpenAI streaming failed for ${agent}; falling back to baseline.`, error);
    accumulated = "";
  }

  const insight: AgentInsight = {
    ...baseline,
    finding: accumulated.trim() || baseline.finding,
  };
  opts.emit({ type: "agent.complete", data: { agent, insight } });
  return insight;
}

function systemFor(agent: AgentName): string {
  switch (agent) {
    case "Research":
      return "You are a competitive research analyst for India quick commerce. Produce a sharp 2-3 sentence finding identifying which competitor is the immediate benchmark and why.";
    case "Trend":
      return "You are a market-trend analyst. Produce a sharp 2-3 sentence finding about quick commerce, premium baskets, and loyalty signals in India.";
    case "Campaign":
      return "You are a growth-marketing analyst. Produce a sharp 2-3 sentence finding about which competitor campaign pattern to model and why.";
    case "Strategy":
      return "You are a Chief Strategy Officer. Synthesize the prior agent findings into a 2-3 sentence executive recommendation for an India quick-commerce challenger.";
  }
}

export async function streamStrategyRun(
  request: MarketRequest,
  opts: StreamOptions,
): Promise<AgentRunResult> {
  const client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
  const mode: AgentRunResult["mode"] = client ? "live-openai" : "demo";

  const [baselineResearch, baselineTrend, baselineCampaign] = await Promise.all([
    runResearchAgent(request),
    runTrendAgent(request),
    runCampaignAgent(request),
  ]);

  const research = await streamAgentFinding("Research", baselineResearch, request, client, opts);
  const trend = await streamAgentFinding("Trend", baselineTrend, request, client, opts);
  const campaign = await streamAgentFinding("Campaign", baselineCampaign, request, client, opts);

  const demo = await runDemoStrategyAgents(request);
  const strategyBaseline: AgentInsight = {
    agent: "Strategy",
    confidence: 86,
    finding: demo.executiveSummary,
    evidence: demo.insights.find((insight) => insight.agent === "Strategy")?.evidence ?? [],
  };
  const strategy = await streamAgentFinding("Strategy", strategyBaseline, request, client, opts);

  const insights: AgentInsight[] = [research, trend, campaign, strategy];
  const plays: StrategyPlay[] = demo.plays;
  const result: AgentRunResult = {
    mode,
    market: request.market,
    company: request.company,
    executiveSummary: strategy.finding,
    insights,
    plays,
  };

  opts.emit({ type: "run.complete", data: { result } });
  return result;
}
