import OpenAI from "openai";
import type {
  AgentInsight,
  AgentName,
  AgentRunResult,
  MarketCompetitor,
  MarketRequest,
  StrategyPlay,
} from "../src/shared/contracts";
import { runCampaignAgent } from "./agents/campaignAgent";
import { runResearchAgent } from "./agents/researchAgent";
import { runDemoStrategyAgents } from "./agents/strategyAgent";
import { runTrendAgent } from "./agents/trendAgent";
import { getMarketDataset } from "./db/repository";

// Context accumulator for agent-to-agent communication
interface AgentContext {
  market: MarketRequest;
  competitors: MarketCompetitor[];
  researchFinding?: string;
  trendFinding?: string;
  campaignFinding?: string;
}

export async function runOpenAIStrategyAgents(request: MarketRequest): Promise<AgentRunResult> {
  if (!process.env.OPENAI_API_KEY) {
    return runDemoStrategyAgents(request);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const demo = await runDemoStrategyAgents(request);
  const { competitors } = await getMarketDataset();

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      input: [
        {
          role: "system",
          content: buildStrategySystemPrompt(request, competitors),
        },
        {
          role: "user",
          content: JSON.stringify({ request, baselineAgentFindings: demo, competitorData: competitors }, null, 2),
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

function buildStrategySystemPrompt(request: MarketRequest, competitors: MarketCompetitor[]): string {
  const competitorList = competitors.map(c => `${c.name} (${c.growth}% growth, ${c.marketShare}% share)`).join(", ");

  return `You are a senior AI business strategist specializing in competitive intelligence for ${request.market}.

MARKET CONTEXT:
- Region: ${request.region}
- Company: ${request.company}
- Objective: ${request.objective}
- Decision type: ${request.decisionType}
- Target customer: ${request.targetCustomer || "not specified"}
- Budget range: ${request.budgetRange || "not specified"}
- Preferred channels: ${request.channels?.join(", ") || "not specified"}
- Time Horizon: ${request.horizon}
- Key Competitors: ${competitorList}
- Focus Areas: ${request.competitors.join(", ") || "all major players"}

YOUR TASK:
Synthesize the agent findings into an executive-ready strategic recommendation. Be specific about:
1. The primary competitive threat and why
2. The most urgent action for ${request.company}
3. Key metrics to track over ${request.horizon}

Keep your response to 3-4 sentences, board-ready, actionable, and data-driven.`;
}

export type StreamEmitter = (event: { type: string; data: unknown }) => void;

type StreamOptions = {
  emit: StreamEmitter;
  signal?: AbortSignal;
};

async function streamAgentFinding(
  agent: AgentName,
  baseline: AgentInsight,
  context: AgentContext,
  client: OpenAI | null,
  opts: StreamOptions,
): Promise<AgentInsight> {
  opts.emit({ type: "agent.start", data: { agent, headline: getAgentHeadline(agent) } });

  if (!client) {
    // Simulate typing effect for demo mode
    const words = baseline.finding.split(" ");
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(" ") + " ";
      opts.emit({ type: "agent.token", data: { agent, delta: chunk } });
      await sleep(50);
    }
    opts.emit({ type: "agent.complete", data: { agent, insight: baseline } });
    return baseline;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const systemPrompt = buildAgentSystemPrompt(agent, context);
  let accumulated = "";

  try {
    const stream = await client.responses.create({
      model,
      stream: true,
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: buildAgentUserPrompt(agent, baseline, context),
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

function getAgentHeadline(agent: AgentName): string {
  switch (agent) {
    case "Research": return "Analyzing competitive landscape...";
    case "Trend": return "Identifying market signals...";
    case "Campaign": return "Evaluating campaign patterns...";
    case "Strategy": return "Synthesizing strategic recommendations...";
  }
}

function buildAgentSystemPrompt(agent: AgentName, ctx: AgentContext): string {
  const competitorNames = ctx.competitors.map(c => c.name).join(", ");
  const topCompetitor = ctx.competitors.sort((a, b) => b.growth - a.growth)[0];

  const baseContext = `
MARKET: ${ctx.market.market}
REGION: ${ctx.market.region}
COMPANY ANALYZING: ${ctx.market.company}
OBJECTIVE: ${ctx.market.objective}
HORIZON: ${ctx.market.horizon}
DECISION TYPE: ${ctx.market.decisionType}
TARGET CUSTOMER: ${ctx.market.targetCustomer || "not specified"}
BUDGET RANGE: ${ctx.market.budgetRange || "not specified"}
PREFERRED CHANNELS: ${ctx.market.channels?.join(", ") || "not specified"}
COMPETITORS: ${competitorNames}
TOP PERFORMER: ${topCompetitor?.name} (${topCompetitor?.growth}% growth)
`;

  switch (agent) {
    case "Research":
      return `You are an elite competitive intelligence analyst.
${baseContext}
TASK: Identify the #1 benchmark competitor and explain WHY they're winning.
Focus on: market share dynamics, growth velocity, strategic moats, channel strength.
Output: 2-3 sharp sentences with specific data points. Be contrarian if the data supports it.`;

    case "Trend":
      const priorContext = ctx.researchFinding ? `\nPRIOR FINDING (Research): ${ctx.researchFinding}` : "";
      return `You are a market trends analyst specializing in demand signals.
${baseContext}${priorContext}
TASK: Identify the 2-3 most important demand shifts happening NOW.
Focus on: category momentum, premium vs value trends, loyalty program traction, seasonal patterns.
Output: 2-3 sentences with acceleration metrics. Quantify the trends.`;

    case "Campaign":
      const trendContext = ctx.trendFinding ? `\nPRIOR FINDING (Trends): ${ctx.trendFinding}` : "";
      return `You are a growth marketing strategist.
${baseContext}${trendContext}
TASK: Recommend ONE campaign pattern to model from competitors.
Focus on: what worked, why it worked, how to adapt it for ${ctx.market.company}.
Output: 2-3 sentences. Be specific about channel, timing, and expected lift.`;

    case "Strategy":
      const allContext = `
RESEARCH FINDING: ${ctx.researchFinding || "Pending..."}
TREND FINDING: ${ctx.trendFinding || "Pending..."}
CAMPAIGN FINDING: ${ctx.campaignFinding || "Pending..."}`;
      return `You are the Chief Strategy Officer presenting to the board.
${baseContext}${allContext}
TASK: Synthesize all findings into ONE executive recommendation.
Format: "For ${ctx.market.company}, the ${ctx.market.horizon} priority is [X]. Here's why: [evidence]. Immediate action: [specific next step]."
Output: 3-4 sentences maximum. Board-ready. No jargon.`;
  }
}

function buildAgentUserPrompt(agent: AgentName, baseline: AgentInsight, ctx: AgentContext): string {
  const competitorData = ctx.competitors.slice(0, 5).map(c => ({
    name: c.name,
    growth: `${c.growth}%`,
    marketShare: `${c.marketShare}%`,
    sentiment: c.sentiment,
    moat: c.moat,
    risk: c.risk,
  }));

  return JSON.stringify({
    task: `Produce a sharper, more insightful version of this ${agent} analysis`,
    baselineFinding: baseline.finding,
    baselineEvidence: baseline.evidence,
    competitorSnapshot: competitorData,
    focusCompetitors: ctx.market.competitors,
    decisionType: ctx.market.decisionType,
    targetCustomer: ctx.market.targetCustomer,
    budgetRange: ctx.market.budgetRange,
    preferredChannels: ctx.market.channels,
    requirement: "Be specific, use numbers, challenge assumptions if data supports it. 2-3 sentences max.",
  }, null, 2);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function streamStrategyRun(
  request: MarketRequest,
  opts: StreamOptions,
): Promise<AgentRunResult> {
  const client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
  const mode: AgentRunResult["mode"] = client ? "live-openai" : "demo";

  // Fetch competitor data for context
  const { competitors } = await getMarketDataset();

  // Initialize context that will be shared across agents
  const context: AgentContext = {
    market: request,
    competitors,
  };

  // Run baseline agents in parallel
  const [baselineResearch, baselineTrend, baselineCampaign] = await Promise.all([
    runResearchAgent(request),
    runTrendAgent(request),
    runCampaignAgent(request),
  ]);

  // Stream Research agent (first, no prior context)
  const research = await streamAgentFinding("Research", baselineResearch, context, client, opts);
  context.researchFinding = research.finding;

  // Stream Trend agent (with research context)
  const trend = await streamAgentFinding("Trend", baselineTrend, context, client, opts);
  context.trendFinding = trend.finding;

  // Stream Campaign agent (with research + trend context)
  const campaign = await streamAgentFinding("Campaign", baselineCampaign, context, client, opts);
  context.campaignFinding = campaign.finding;

  // Stream Strategy agent (with all prior context)
  const demo = await runDemoStrategyAgents(request);
  const strategyBaseline: AgentInsight = {
    agent: "Strategy",
    confidence: 86,
    finding: demo.executiveSummary,
    evidence: demo.insights.find((insight) => insight.agent === "Strategy")?.evidence ?? [],
  };
  const strategy = await streamAgentFinding("Strategy", strategyBaseline, context, client, opts);

  // Generate dynamic plays based on findings
  const plays: StrategyPlay[] = generateDynamicPlays(context, demo.plays);

  const insights: AgentInsight[] = [research, trend, campaign, strategy];
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

function generateDynamicPlays(ctx: AgentContext, basePlays: StrategyPlay[]): StrategyPlay[] {
  const topCompetitor = ctx.competitors.sort((a, b) => b.growth - a.growth)[0];

  // Enhance base plays with dynamic context
  const enhancedPlays = basePlays.map((play, i) => {
    if (i === 0 && topCompetitor) {
      return {
        ...play,
        action: `${play.action} Benchmark against ${topCompetitor.name}'s ${topCompetitor.fastestChannel} strategy.`,
      };
    }
    return play;
  });

  // Add AI-generated play based on research finding
  if (ctx.researchFinding && enhancedPlays.length < 5) {
    enhancedPlays.push({
      title: "Competitive Response",
      team: "Growth",
      priority: "High",
      action: `Based on research: Focus on areas where ${topCompetitor?.name || "top competitor"} shows vulnerability. Monitor their ${topCompetitor?.risk || "key risk areas"} for opportunities.`,
    });
  }

  return enhancedPlays;
}

// Export for chat interface
export async function chatWithAI(
  message: string,
  marketContext: MarketRequest,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "AI chat requires an OpenAI API key. Set OPENAI_API_KEY in your .env to enable the assistant.";
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { competitors, trends, campaigns } = await getMarketDataset();

  // Keep the most recent turns so context stays focused and within token limits.
  const recentHistory = history.slice(-10).map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      input: [
        {
          role: "system",
          content: `You are VantageIQ, an AI competitive intelligence assistant for ${marketContext.market}.

AVAILABLE DATA:
- Competitors: ${competitors.map(c => `${c.name} (${c.growth}% growth)`).join(", ")}
- Market Trends: ${trends.slice(-3).map(t => `${t.period}: QC=${t.quickCommerce}, Premium=${t.premiumProducts}`).join("; ")}
- Recent Campaigns: ${campaigns.slice(0, 3).map(c => `${c.brand}: ${c.name}`).join(", ")}

USER CONTEXT:
- Company: ${marketContext.company}
- Objective: ${marketContext.objective}
- Decision type: ${marketContext.decisionType}
- Target customer: ${marketContext.targetCustomer || "not specified"}
- Preferred channels: ${marketContext.channels?.join(", ") || "not specified"}
- Region: ${marketContext.region}

Answer questions about competitors, market trends, and strategic recommendations. Use the prior conversation for follow-up context. Be concise and data-driven.`,
        },
        ...recentHistory,
        { role: "user", content: message },
      ],
    });

    return response.output_text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Error processing your question. Please try again.";
  }
}
