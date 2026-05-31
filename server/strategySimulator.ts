import type {
  MarketCompetitor,
  ScenarioSimulatorRequest,
  ScenarioSimulatorResult,
} from "../src/shared/contracts";
import { getMarketDataset } from "./db/repository";

export async function simulateScenario(input: ScenarioSimulatorRequest): Promise<ScenarioSimulatorResult> {
  const { competitors } = await getMarketDataset();
  const competitor = findCompetitor(competitors, input.competitor) ?? [...competitors].sort((a, b) => b.growth - a.growth)[0];
  const budgetWeight = budgetScore(input.budgetRange);
  const channelFit = channelScore(input.channel, competitor);
  const objectiveFit = objectiveScore(input.objective);
  const horizonWeight = horizonScore(input.horizon);

  const threatPressure = Math.min(100, competitor.growth * 0.35 + competitor.marketShare * 0.55 + competitor.engagement * 0.2);
  const upsideScore = clamp(Math.round(budgetWeight * 0.28 + channelFit * 0.28 + objectiveFit * 0.22 + horizonWeight * 0.22));
  const riskScore = clamp(Math.round(threatPressure * 0.52 + (100 - budgetWeight) * 0.2 + (100 - channelFit) * 0.18));
  const confidence = clamp(Math.round(58 + competitor.sentiment * 0.18 + channelFit * 0.16 + objectiveFit * 0.1));

  return {
    upsideScore,
    riskScore,
    confidence,
    expectedOutcome: buildExpectedOutcome(input, competitor, upsideScore),
    recommendedMove: buildRecommendedMove(input, competitor),
    likelyCompetitorResponse: buildCompetitorResponse(input, competitor),
    watchMetrics: [
      "Market share delta by city",
      "Repeat rate and order frequency",
      "Contribution margin after incentives",
      `${competitor.name} campaign intensity`,
    ],
  };
}

function findCompetitor(competitors: MarketCompetitor[], name: string) {
  const normalized = name.toLowerCase();
  return competitors.find((competitor) => competitor.name.toLowerCase() === normalized)
    ?? competitors.find((competitor) => competitor.name.toLowerCase().includes(normalized));
}

function budgetScore(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("enterprise") || normalized.includes("high") || normalized.includes("1cr")) return 88;
  if (normalized.includes("medium") || normalized.includes("50")) return 72;
  if (normalized.includes("low") || normalized.includes("pilot")) return 58;
  return 66;
}

function channelScore(channel: string, competitor: MarketCompetitor) {
  const normalized = channel.toLowerCase();
  const competitorChannel = competitor.fastestChannel.toLowerCase();
  if (competitorChannel.includes(normalized) || normalized.includes("app") || normalized.includes("crm")) return 86;
  if (normalized.includes("social") || normalized.includes("creator")) return 76;
  if (normalized.includes("offline") || normalized.includes("partnership")) return 68;
  return 62;
}

function objectiveScore(objective: string) {
  const normalized = objective.toLowerCase();
  if (normalized.includes("retention") || normalized.includes("loyalty")) return 84;
  if (normalized.includes("growth") || normalized.includes("share")) return 80;
  if (normalized.includes("margin") || normalized.includes("profit")) return 74;
  if (normalized.includes("pricing")) return 70;
  return 66;
}

function horizonScore(horizon: string) {
  if (horizon.includes("7")) return 58;
  if (horizon.includes("30")) return 76;
  if (horizon.includes("90")) return 84;
  return 72;
}

function buildExpectedOutcome(input: ScenarioSimulatorRequest, competitor: MarketCompetitor, upsideScore: number) {
  if (upsideScore >= 78) {
    return `The company can create a visible ${input.horizon} response against ${competitor.name} if execution stays city-specific and margin controls are enforced.`;
  }
  return `The move can produce directional learning against ${competitor.name}, but it should stay in pilot mode until channel economics and repeat behavior are proven.`;
}

function buildRecommendedMove(input: ScenarioSimulatorRequest, competitor: MarketCompetitor) {
  return `Run a ${input.channel} play focused on ${input.objective.toLowerCase()}, benchmarked against ${competitor.name}'s ${competitor.fastestChannel}. Start in the cities or segments where competitive pressure from ${competitor.name} is highest.`;
}

function buildCompetitorResponse(input: ScenarioSimulatorRequest, competitor: MarketCompetitor) {
  const channel = input.channel.toLowerCase().includes("pricing") ? "matching discounts" : "doubling down on owned app and loyalty surfaces";
  return `${competitor.name} will likely respond by ${channel}, using its ${competitor.moat.toLowerCase()} to protect frequency.`;
}

function clamp(value: number) {
  return Math.max(1, Math.min(100, value));
}
