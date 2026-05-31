// Client-side A/B test planner model + persistence.
// Tests live in localStorage so they survive refreshes without backend changes.

export type CampaignTestMetric = "Conversion rate" | "Average order value" | "Retention" | "Click-through rate";

export type CampaignTest = {
  id: string;
  name: string;
  baseCampaign: string;
  variantChannel: string;
  metric: CampaignTestMetric;
  splitPercent: number;
  durationDays: number;
  hypothesis: string;
  projectedLift: number;
  confidence: number;
  status: "planned";
  createdAt: string;
};

const STORAGE_KEY = "vantageiq.campaignTests";

const METRIC_BASE_LIFT: Record<CampaignTestMetric, number> = {
  "Conversion rate": 8,
  "Average order value": 6,
  Retention: 5,
  "Click-through rate": 12,
};

function channelMultiplier(channel: string): number {
  const normalized = channel.toLowerCase();
  if (normalized.includes("creator")) return 1.3;
  if (normalized.includes("loyalty")) return 1.25;
  if (normalized.includes("social")) return 1.2;
  if (normalized.includes("search")) return 1.15;
  if (normalized.includes("crm") || normalized.includes("app")) return 1.1;
  if (normalized.includes("pricing")) return 0.9;
  return 1;
}

// Deterministic projection so the same inputs always yield the same estimate.
export function projectTest(input: {
  metric: CampaignTestMetric;
  variantChannel: string;
  splitPercent: number;
  durationDays: number;
}): { projectedLift: number; confidence: number } {
  const base = METRIC_BASE_LIFT[input.metric] ?? 7;
  const lift = base * channelMultiplier(input.variantChannel) * (0.8 + input.splitPercent / 250);
  const projectedLift = Math.round(lift * 10) / 10;
  const confidence = Math.max(50, Math.min(95, Math.round(50 + input.durationDays * 0.5 + input.splitPercent * 0.2)));
  return { projectedLift, confidence };
}

export function loadCampaignTests(): CampaignTest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CampaignTest[]) : [];
  } catch {
    return [];
  }
}

export function saveCampaignTests(tests: CampaignTest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  } catch {
    // Storage may be unavailable (private mode); tests just won't persist.
  }
}
