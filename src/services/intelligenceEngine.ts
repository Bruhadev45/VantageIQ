import type { MarketDatasetResponse } from "../shared/contracts";

export type MarketBrief = {
  market: string;
  generatedAt: string;
  threatLevel: "Low" | "Medium" | "High";
  summary: string;
  growthExplanation: string[];
  recommendedNextSteps: string[];
};

export function generateMarketBrief(
  market: string,
  dataset: Pick<MarketDatasetResponse, "competitors" | "campaigns" | "trends" | "recommendations">,
): MarketBrief {
  const competitors = dataset.competitors;
  const fastest = [...competitors].sort((a, b) => b.growth - a.growth)[0];
  const leader = [...competitors].sort((a, b) => b.marketShare - a.marketShare)[0];
  const highestEngagement = [...competitors].sort((a, b) => b.engagement - a.engagement)[0];
  const topCampaign = dataset.campaigns[0];
  const latestTrend = dataset.trends[dataset.trends.length - 1];
  const previousTrend = dataset.trends[dataset.trends.length - 2];
  const quickCommerceAcceleration =
    latestTrend && previousTrend ? latestTrend.quickCommerce - previousTrend.quickCommerce : 0;

  // Derive threat level from the fastest rival's growth and the leader's concentration.
  const maxGrowth = fastest?.growth ?? 0;
  const leaderShare = leader?.marketShare ?? 0;
  const threatLevel: MarketBrief["threatLevel"] =
    maxGrowth >= 80 || leaderShare >= 40 ? "High" : maxGrowth >= 30 || leaderShare >= 20 ? "Medium" : "Low";

  const summary =
    fastest && leader
      ? `${market} is a race for density, loyalty, and unit economics. ${leader.name} leads on share (${leader.marketShare}%) while ${fastest.name} is growing fastest at ${fastest.growth}%. Winning means defending frequency while protecting contribution margin.`
      : `${market} intelligence is still loading — add competitors and run a live market scan to generate a data-backed thesis.`;

  const growthExplanation: string[] = [];
  if (fastest) {
    growthExplanation.push(
      `${fastest.name} is growing ${fastest.growth}% because it combines speed positioning, metro focus, and aggressive capital deployment.`,
    );
  }
  if (highestEngagement) {
    growthExplanation.push(
      `${highestEngagement.name} has the strongest engagement score at ${highestEngagement.engagement}, driven by ${highestEngagement.fastestChannel.toLowerCase()}.`,
    );
  }
  if (topCampaign) {
    growthExplanation.push(`${topCampaign.name} worked because ${topCampaign.whyItWorked.toLowerCase()}`);
  }
  growthExplanation.push(
    `Quick-commerce demand changed by ${quickCommerceAcceleration} points period over period, signalling timing for city-level expansion.`,
  );

  return {
    market,
    generatedAt: new Date().toISOString(),
    threatLevel,
    summary,
    growthExplanation,
    recommendedNextSteps: dataset.recommendations.slice(0, 3).map((recommendation) => recommendation.action),
  };
}

export function calculateOpportunityScore(
  dataset: Pick<MarketDatasetResponse, "competitors" | "recommendations">,
): number {
  const { competitors, recommendations } = dataset;
  if (!competitors.length || !recommendations.length) return 0;

  const growthAverage = competitors.reduce((sum, c) => sum + c.growth, 0) / competitors.length;
  const engagementAverage = competitors.reduce((sum, c) => sum + c.engagement, 0) / competitors.length;
  const recommendationAverage =
    recommendations.reduce((sum, r) => sum + r.impact, 0) / recommendations.length;

  return Math.round(growthAverage * 0.8 + engagementAverage * 0.35 + recommendationAverage * 0.45);
}
