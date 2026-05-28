import { z } from "zod";

export const MarketRequestSchema = z.object({
  market: z.string().min(2).max(120).default("India quick commerce"),
  company: z.string().min(2).max(120).default("Your company"),
  competitors: z.array(z.string().min(2).max(120)).max(8).default([]),
});

export type MarketRequest = z.infer<typeof MarketRequestSchema>;

export type AgentName = "Research" | "Trend" | "Campaign" | "Strategy";

export type AgentInsight = {
  agent: AgentName;
  finding: string;
  confidence: number;
  evidence: string[];
};

export type StrategyPlay = {
  title: string;
  team: "Sales" | "Marketing" | "Growth" | "Customer Success";
  priority: "High" | "Medium" | "Low";
  action: string;
};

export type AgentRunResult = {
  mode: "live-openai" | "demo";
  market: string;
  company: string;
  executiveSummary: string;
  insights: AgentInsight[];
  plays: StrategyPlay[];
};

export type MarketSourceSummary = {
  title: string;
  publisher: string;
  url: string;
  date: string;
  notes: string;
};

export type MarketDatasetResponse = {
  sources: MarketSourceSummary[];
  competitors: MarketCompetitor[];
  trends: MarketTrendPoint[];
  campaigns: MarketCampaign[];
  recommendations: MarketRecommendation[];
};

export type MarketCompetitor = {
  id: string;
  name: string;
  category: string;
  marketShare: number;
  growth: number;
  sentiment: number;
  engagement: number;
  revenueInrCr: number | null;
  cities: number | null;
  stores: number | null;
  pricing: string;
  moat: string;
  fastestChannel: string;
  risk: string;
  insight: string;
};

export type MarketTrendPoint = {
  period: string;
  quickCommerce: number;
  premiumProducts: number;
  festiveDemand: number;
  loyalty: number;
};

export type MarketCampaign = {
  id: string;
  brand: string;
  name: string;
  channel: string;
  lift: string;
  spend: string;
  pattern: string;
  whyItWorked: string;
};

export type MarketRecommendation = {
  id: string;
  title: string;
  impact: number;
  confidence: number;
  motion: string;
  action: string;
};

export type RunStatus = "pending" | "streaming" | "completed" | "failed";

export type RunSummary = {
  id: string;
  status: RunStatus;
  mode: "live-openai" | "demo";
  market: string;
  company: string;
  competitors: string[];
  executiveSummary: string | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  costUsd: number | null;
};

export type RunDetail = RunSummary & {
  insights: AgentInsight[];
  plays: StrategyPlay[];
};

export type RunStreamEvent =
  | { type: "agent.start"; agent: AgentName }
  | { type: "agent.token"; agent: AgentName; delta: string }
  | { type: "agent.complete"; agent: AgentName; insight: AgentInsight }
  | { type: "run.complete"; result: AgentRunResult }
  | { type: "error"; message: string };
