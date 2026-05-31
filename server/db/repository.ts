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
  const reliability = scoreSourceReliability(row);
  return {
    id: row.id,
    title: row.title,
    publisher: row.publisher,
    url: row.url,
    date: row.date,
    notes: row.notes,
    reliabilityScore: reliability.score,
    reliabilityLabel: reliability.label,
    recencyDays: reliability.recencyDays,
    evidenceStrength: reliability.evidenceStrength,
  };
}

function scoreSourceReliability(row: { publisher: string; url: string; date: string; notes: string }) {
  const publisher = row.publisher.toLowerCase();
  const host = safeHostname(row.url);
  const institutionalPublisher =
    publisher.includes("usda") ||
    publisher.includes("swiggy") ||
    publisher.includes("exchange") ||
    publisher.includes("filing") ||
    host.endsWith(".gov") ||
    host.endsWith(".edu") ||
    host.includes("swiggy.com");
  const knownBusinessPublisher =
    publisher.includes("financial") ||
    publisher.includes("economic") ||
    publisher.includes("business") ||
    publisher.includes("indira");

  const recencyDays = daysSince(row.date);
  const recencyScore = recencyDays === null ? 12 : recencyDays <= 90 ? 25 : recencyDays <= 365 ? 18 : 10;
  const publisherScore = institutionalPublisher ? 35 : knownBusinessPublisher ? 28 : 18;
  const signalCount = row.notes.split("|").map((signal) => signal.trim()).filter(Boolean).length;
  const evidenceStrength = Math.min(30, 10 + signalCount * 4 + (/\d/.test(row.notes) ? 6 : 0));
  const score = Math.max(1, Math.min(100, publisherScore + recencyScore + evidenceStrength));
  const label: MarketSourceSummary["reliabilityLabel"] = score >= 78 ? "High" : score >= 55 ? "Medium" : "Low";

  return { score, label, recencyDays, evidenceStrength };
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function daysSince(value: string): number | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return days < 0 ? 0 : days;
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

export async function createCompetitor(input: {
  name: string;
  category: string;
  marketShare: number;
  growth: number;
  sentiment: number;
  engagement: number;
  pricing: string;
  moat: string;
  fastestChannel: string;
  risk: string;
  insight: string;
}): Promise<MarketCompetitor> {
  const id = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `competitor-${Date.now().toString(36)}`;

  const row = await prisma.competitor.upsert({
    where: { id },
    update: {
      name: input.name,
      category: input.category,
    },
    create: {
      id,
      name: input.name,
      category: input.category,
      marketShare: input.marketShare,
      growth: input.growth,
      sentiment: input.sentiment,
      engagement: input.engagement,
      revenueInrCr: null,
      cities: null,
      stores: null,
      pricing: input.pricing,
      moat: input.moat,
      fastestChannel: input.fastestChannel,
      risk: input.risk,
      insight: input.insight,
      sourceId: "user-added",
    },
  });

  return toCompetitor(row);
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

// ==================== Alerts ====================

export type AlertSummary = {
  id: string;
  type: string;
  severity: string;
  competitor: string;
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  isRead: boolean;
  triggeredAt: string;
};

export type AlertRuleSummary = {
  id: string;
  name: string;
  competitor: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: string;
  isEnabled: boolean;
};

export async function listAlerts(limit = 50): Promise<AlertSummary[]> {
  const rows = await prisma.alert.findMany({
    where: { isActive: true },
    orderBy: { triggeredAt: "desc" },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    severity: row.severity,
    competitor: row.competitor,
    metric: row.metric,
    currentValue: row.currentValue,
    threshold: row.threshold,
    message: row.message,
    isRead: row.isRead,
    triggeredAt: row.triggeredAt.toISOString(),
  }));
}

export async function markAlertRead(id: string): Promise<void> {
  await prisma.alert.update({ where: { id }, data: { isRead: true } });
}

export async function markAllAlertsRead(): Promise<void> {
  await prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } });
}

export async function createAlert(input: {
  type: string;
  severity: string;
  competitor: string;
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
}): Promise<AlertSummary> {
  const row = await prisma.alert.create({ data: input });
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    competitor: row.competitor,
    metric: row.metric,
    currentValue: row.currentValue,
    threshold: row.threshold,
    message: row.message,
    isRead: row.isRead,
    triggeredAt: row.triggeredAt.toISOString(),
  };
}

export async function listAlertRules(): Promise<AlertRuleSummary[]> {
  const rows = await prisma.alertRule.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    competitor: row.competitor,
    metric: row.metric,
    operator: row.operator,
    threshold: row.threshold,
    severity: row.severity,
    isEnabled: row.isEnabled,
  }));
}

export async function createAlertRule(input: {
  name: string;
  competitor: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: string;
}): Promise<AlertRuleSummary> {
  const row = await prisma.alertRule.create({ data: input });
  return {
    id: row.id,
    name: row.name,
    competitor: row.competitor,
    metric: row.metric,
    operator: row.operator,
    threshold: row.threshold,
    severity: row.severity,
    isEnabled: row.isEnabled,
  };
}

export async function toggleAlertRule(id: string, isEnabled: boolean): Promise<void> {
  await prisma.alertRule.update({ where: { id }, data: { isEnabled } });
}

export async function deleteAlertRule(id: string): Promise<void> {
  await prisma.alertRule.delete({ where: { id } });
}

// Window (ms) within which a matching unread alert suppresses a duplicate.
const ALERT_DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Check all rules against current data and create alerts
export async function checkAlertRules(): Promise<AlertSummary[]> {
  const [rules, { competitors }] = await Promise.all([
    prisma.alertRule.findMany({ where: { isEnabled: true } }),
    getMarketDataset(),
  ]);

  const newAlerts: AlertSummary[] = [];
  const since = new Date(Date.now() - ALERT_DEDUP_WINDOW_MS);

  for (const rule of rules) {
    const targetCompetitors = rule.competitor === "any"
      ? competitors
      : competitors.filter((c) => c.name.toLowerCase() === rule.competitor.toLowerCase());

    for (const comp of targetCompetitors) {
      const value = getMetricValue(comp, rule.metric);
      if (value === null) continue;

      const triggered = checkThreshold(value, rule.operator, rule.threshold);
      if (!triggered) continue;

      const type = `${rule.metric}_${rule.operator}`;

      // Deduplicate: skip if an equivalent alert already fired recently.
      const existing = await prisma.alert.findFirst({
        where: {
          competitor: comp.name,
          metric: rule.metric,
          type,
          isActive: true,
          triggeredAt: { gte: since },
        },
      });
      if (existing) continue;

      const alert = await createAlert({
        type,
        severity: rule.severity,
        competitor: comp.name,
        metric: rule.metric,
        currentValue: value,
        threshold: rule.threshold,
        message: `${comp.name}'s ${metricLabel(rule.metric)} (${value}) ${operatorText(rule.operator)} ${rule.threshold}`,
      });
      newAlerts.push(alert);
    }
  }

  return newAlerts;
}

function metricLabel(metric: string): string {
  switch (metric) {
    case "growth": return "growth";
    case "marketShare": return "market share";
    case "sentiment": return "sentiment";
    case "engagement": return "engagement";
    default: return metric;
  }
}

function getMetricValue(comp: MarketCompetitor, metric: string): number | null {
  switch (metric) {
    case "growth": return comp.growth;
    case "marketShare": return comp.marketShare;
    case "sentiment": return comp.sentiment;
    case "engagement": return comp.engagement;
    default: return null;
  }
}

function checkThreshold(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case "gt": return value > threshold;
    case "lt": return value < threshold;
    case "eq": return value === threshold;
    case "gte": return value >= threshold;
    case "lte": return value <= threshold;
    default: return false;
  }
}

function operatorText(operator: string): string {
  switch (operator) {
    case "gt": return "exceeded";
    case "lt": return "dropped below";
    case "eq": return "equals";
    case "gte": return "reached or exceeded";
    case "lte": return "fell to or below";
    default: return "triggered at";
  }
}
