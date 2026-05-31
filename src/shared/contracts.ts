import { z } from "zod";

export const MarketRequestSchema = z.object({
  market: z.string().min(2).max(120).default("India quick commerce"),
  company: z.string().min(2).max(120).default("Your company"),
  region: z.string().min(2).max(120).default("India"),
  // The UI packs decision type, target customer, budget and channels into this
  // field as a single context blob for the agents, so it needs generous room.
  objective: z.string().min(2).max(600).default("Find growth opportunities and campaign ideas"),
  horizon: z.string().min(2).max(80).default("30 days"),
  competitors: z.array(z.string().min(2).max(120)).max(8).default([]),
  decisionType: z
    .enum(["growth", "pricing", "campaign", "product", "market-entry", "board-brief"])
    .default("growth"),
  budgetRange: z.string().max(80).optional().default(""),
  targetCustomer: z.string().max(140).optional().default(""),
  channels: z.array(z.string().min(2).max(80)).max(8).optional().default([]),
  sourceUrls: z.array(z.string().url()).max(10).optional().default([]),
});

export type MarketRequest = z.infer<typeof MarketRequestSchema>;

export const SourceIngestionSchema = z.object({
  url: z.string().url(),
  market: z.string().min(2).max(120).default("India quick commerce"),
  competitor: z.string().max(120).optional(),
});

export type SourceIngestionRequest = z.infer<typeof SourceIngestionSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(ChatMessageSchema).max(20).optional().default([]),
  context: z
    .object({
      market: z.string().max(120).optional(),
      company: z.string().max(120).optional(),
      region: z.string().max(120).optional(),
      objective: z.string().max(400).optional(),
      horizon: z.string().max(80).optional(),
      competitors: z.array(z.string().max(120)).max(8).optional(),
    })
    .optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const CreateCompetitorSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(120).default("Challenger"),
  marketShare: z.number().min(0).max(100).optional().default(0),
  growth: z.number().min(-100).max(1000).optional().default(0),
  sentiment: z.number().min(0).max(100).optional().default(60),
  engagement: z.number().min(0).max(100).optional().default(50),
  pricing: z.string().max(200).optional().default("Not yet profiled"),
  moat: z.string().max(400).optional().default("Pending analysis"),
  fastestChannel: z.string().max(120).optional().default("Unknown"),
  risk: z.enum(["Low", "Medium", "High"]).optional().default("Medium"),
  insight: z.string().max(600).optional().default("Newly tracked — run a live market scan or agent run to enrich this profile."),
});

// Use input type so callers only need to supply `name`; the rest default server-side.
export type CreateCompetitorRequest = z.input<typeof CreateCompetitorSchema>;

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
  id?: string;
  title: string;
  publisher: string;
  url: string;
  date: string;
  notes: string;
  reliabilityScore?: number;
  reliabilityLabel?: "High" | "Medium" | "Low";
  recencyDays?: number | null;
  evidenceStrength?: number;
};

export type SourceIngestionResult = {
  source: MarketSourceSummary;
  extractedSignals: string[];
};

export const ScenarioSimulatorRequestSchema = z.object({
  competitor: z.string().min(2).max(120),
  budgetRange: z.string().min(2).max(80),
  channel: z.string().min(2).max(80),
  objective: z.string().min(2).max(180),
  horizon: z.string().min(2).max(80),
});

export type ScenarioSimulatorRequest = {
  competitor: string;
  budgetRange: string;
  channel: string;
  objective: string;
  horizon: string;
};

export type ScenarioSimulatorResult = {
  upsideScore: number;
  riskScore: number;
  confidence: number;
  expectedOutcome: string;
  recommendedMove: string;
  likelyCompetitorResponse: string;
  watchMetrics: string[];
};

export type LiveResearchResult = {
  query: string;
  providers: string[];
  sources: SourceIngestionResult[];
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
  region: string;
  objective: string;
  horizon: string;
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

// Alert types
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertOperator = "gt" | "lt" | "eq" | "gte" | "lte";
export type AlertMetric = "growth" | "marketShare" | "sentiment" | "engagement";

export type Alert = {
  id: string;
  type: string;
  severity: AlertSeverity;
  competitor: string;
  metric: AlertMetric;
  currentValue: number;
  threshold: number;
  message: string;
  isRead: boolean;
  triggeredAt: string;
};

export type AlertRule = {
  id: string;
  name: string;
  competitor: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  isEnabled: boolean;
};

export type CreateAlertRuleRequest = {
  name: string;
  competitor: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
};
