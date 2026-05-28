import type {
  AgentInsight,
  MarketCampaign,
  MarketCompetitor,
  MarketDatasetResponse,
  MarketRecommendation,
  MarketSourceSummary,
  MarketTrendPoint,
  RunDetail,
  RunStatus,
  RunSummary,
  StrategyPlay,
} from "../../src/shared/contracts";
import { prisma } from "./client";

export async function getMarketDataset(): Promise<MarketDatasetResponse> {
  const [competitors, trends, campaigns, recommendations, sources] = await Promise.all([
    prisma.competitor.findMany({ orderBy: { marketShare: "desc" } }),
    prisma.trendSignal.findMany(),
    prisma.campaignPattern.findMany(),
    prisma.recommendation.findMany({ orderBy: { impact: "desc" } }),
    prisma.marketSource.findMany({ orderBy: { date: "desc" } }),
  ]);

  return {
    sources: sources.map(toSourceSummary),
    competitors: competitors.map(toCompetitor),
    trends: trends
      .map(toTrendPoint)
      .sort((a, b) => monthOrder(a.period) - monthOrder(b.period)),
    campaigns: campaigns.map(toCampaign),
    recommendations: recommendations.map(toRecommendation),
  };
}

function monthOrder(period: string) {
  const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const index = order.indexOf(period);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function toSourceSummary(row: {
  id?: string;
  title: string;
  publisher: string;
  url: string;
  date: string;
  notes: string;
}): MarketSourceSummary {
  return {
    id: row.id,
    title: row.title,
    publisher: row.publisher,
    url: row.url,
    date: row.date,
    notes: row.notes,
  };
}

function toCompetitor(row: {
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
}): MarketCompetitor {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    marketShare: row.marketShare,
    growth: row.growth,
    sentiment: row.sentiment,
    engagement: row.engagement,
    revenueInrCr: row.revenueInrCr,
    cities: row.cities,
    stores: row.stores,
    pricing: row.pricing,
    moat: row.moat,
    fastestChannel: row.fastestChannel,
    risk: row.risk,
    insight: row.insight,
  };
}

function toTrendPoint(row: {
  period: string;
  quickCommerce: number;
  premiumProducts: number;
  festiveDemand: number;
  loyalty: number;
}): MarketTrendPoint {
  return {
    period: row.period,
    quickCommerce: row.quickCommerce,
    premiumProducts: row.premiumProducts,
    festiveDemand: row.festiveDemand,
    loyalty: row.loyalty,
  };
}

function toCampaign(row: {
  id: string;
  brand: string;
  name: string;
  channel: string;
  lift: string;
  spend: string;
  pattern: string;
  whyItWorked: string;
}): MarketCampaign {
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    channel: row.channel,
    lift: row.lift,
    spend: row.spend,
    pattern: row.pattern,
    whyItWorked: row.whyItWorked,
  };
}

function toRecommendation(row: {
  id: string;
  title: string;
  impact: number;
  confidence: number;
  motion: string;
  action: string;
}): MarketRecommendation {
  return {
    id: row.id,
    title: row.title,
    impact: row.impact,
    confidence: row.confidence,
    motion: row.motion,
    action: row.action,
  };
}

type RunRow = {
  id: string;
  status: string;
  mode: string;
  market: string;
  company: string;
  region: string;
  objective: string;
  horizon: string;
  competitorsJson: unknown;
  executiveSummary: string | null;
  insightsJson: unknown;
  playsJson: unknown;
  costUsd: number | null;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
};

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseInsights(value: unknown): AgentInsight[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is AgentInsight => {
      return Boolean(
        item &&
          typeof item === "object" &&
          "agent" in item &&
          "finding" in item &&
          "confidence" in item &&
          "evidence" in item,
      );
    })
    .map((item) => ({
      agent: item.agent,
      finding: item.finding,
      confidence: item.confidence,
      evidence: Array.isArray(item.evidence) ? item.evidence : [],
    }));
}

function parsePlays(value: unknown): StrategyPlay[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StrategyPlay => {
    return Boolean(
      item && typeof item === "object" && "title" in item && "team" in item && "priority" in item && "action" in item,
    );
  });
}

function toRunSummary(row: RunRow): RunSummary {
  return {
    id: row.id,
    status: row.status as RunStatus,
    mode: row.mode === "live-openai" ? "live-openai" : "demo",
    market: row.market,
    company: row.company,
    region: row.region,
    objective: row.objective,
    horizon: row.horizon,
    competitors: parseStringArray(row.competitorsJson),
    executiveSummary: row.executiveSummary,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    error: row.error,
    costUsd: row.costUsd,
  };
}

function toRunDetail(row: RunRow): RunDetail {
  return {
    ...toRunSummary(row),
    insights: parseInsights(row.insightsJson),
    plays: parsePlays(row.playsJson),
  };
}

export async function createRun(input: {
  market: string;
  company: string;
  region: string;
  objective: string;
  horizon: string;
  competitors: string[];
}): Promise<RunDetail> {
  const row = await prisma.run.create({
    data: {
      market: input.market,
      company: input.company,
      region: input.region,
      objective: input.objective,
      horizon: input.horizon,
      competitorsJson: input.competitors,
      status: "pending",
    },
  });
  return toRunDetail(row as RunRow);
}

export async function listRuns(limit = 20): Promise<RunSummary[]> {
  const rows = await prisma.run.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return (rows as RunRow[]).map(toRunSummary);
}

export async function getRun(id: string): Promise<RunDetail | null> {
  const row = await prisma.run.findUnique({ where: { id } });
  return row ? toRunDetail(row as RunRow) : null;
}

export async function updateRun(
  id: string,
  patch: {
    status?: RunStatus;
    mode?: "demo" | "live-openai";
    executiveSummary?: string | null;
    insights?: AgentInsight[];
    plays?: StrategyPlay[];
    costUsd?: number | null;
    error?: string | null;
    completedAt?: Date | null;
  },
): Promise<RunDetail> {
  const data: Record<string, unknown> = {};
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.mode !== undefined) data.mode = patch.mode;
  if (patch.executiveSummary !== undefined) data.executiveSummary = patch.executiveSummary;
  if (patch.insights !== undefined) data.insightsJson = patch.insights;
  if (patch.plays !== undefined) data.playsJson = patch.plays;
  if (patch.costUsd !== undefined) data.costUsd = patch.costUsd;
  if (patch.error !== undefined) data.error = patch.error;
  if (patch.completedAt !== undefined) data.completedAt = patch.completedAt;

  const row = await prisma.run.update({ where: { id }, data });
  return toRunDetail(row as RunRow);
}
