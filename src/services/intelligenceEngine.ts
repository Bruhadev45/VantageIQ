import { campaigns, competitors, recommendations, trendData } from "../data/market";

export type MarketBrief = {
  market: string;
  generatedAt: string;
  threatLevel: "Low" | "Medium" | "High";
  summary: string;
  growthExplanation: string[];
  recommendedNextSteps: string[];
};

export function generateMarketBrief(market = "India quick commerce"): MarketBrief {
  const fastest = [...competitors].sort((a, b) => b.growth - a.growth)[0];
  const highestEngagement = [...competitors].sort((a, b) => b.engagement - a.engagement)[0];
  const topCampaign = campaigns[0];
  const latestTrend = trendData[trendData.length - 1];
  const previousTrend = trendData[trendData.length - 2];
  const quickCommerceAcceleration = latestTrend.quickCommerce - previousTrend.quickCommerce;

  return {
    market,
    generatedAt: new Date().toISOString(),
    threatLevel: "High",
    summary:
      "India quick commerce is a density, loyalty, and unit-economics race. Blinkit leads on ecosystem leverage, Zepto is buying speed-led youth mindshare, and Instamart is scaling reach through Swiggy's membership base.",
    growthExplanation: [
      `${fastest.name} is growing ${fastest.growth}% because it combines speed positioning, metro focus, and aggressive capital deployment.`,
      `${highestEngagement.name} has the strongest engagement score at ${highestEngagement.engagement}, driven by ${highestEngagement.fastestChannel.toLowerCase()}.`,
      `${topCampaign.name} worked because ${topCampaign.whyItWorked.toLowerCase()}`,
      `Quick-commerce demand increased ${quickCommerceAcceleration} points month over month, creating a timely entry point for city-level expansion strategy.`,
    ],
    recommendedNextSteps: recommendations.slice(0, 3).map((recommendation) => recommendation.action),
  };
}

export function calculateOpportunityScore() {
  const growthAverage = competitors.reduce((sum, competitor) => sum + competitor.growth, 0) / competitors.length;
  const engagementAverage =
    competitors.reduce((sum, competitor) => sum + competitor.engagement, 0) / competitors.length;
  const recommendationAverage =
    recommendations.reduce((sum, recommendation) => sum + recommendation.impact, 0) / recommendations.length;

  return Math.round(growthAverage * 0.8 + engagementAverage * 0.35 + recommendationAverage * 0.45);
}
