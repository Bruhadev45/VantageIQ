import type { AgentRunResult, MarketRequest } from "../../src/shared/contracts";
import { getMarketDataset } from "../db/repository";
import { runCampaignAgent } from "./campaignAgent";
import { runResearchAgent } from "./researchAgent";
import { runTrendAgent } from "./trendAgent";

export async function runDemoStrategyAgents(request: MarketRequest): Promise<AgentRunResult> {
  const [{ recommendations }, ...insights] = await Promise.all([
    getMarketDataset(),
    runResearchAgent(request),
    runTrendAgent(request),
    runCampaignAgent(request),
  ]);

  return {
    mode: "demo",
    market: request.market,
    company: request.company,
    executiveSummary:
      `${request.market} in ${request.region} is a density and loyalty race. For ${request.company}, the ${request.horizon} priority is ${request.objective.toLowerCase()}: use city-level economics, local assortment, premium basket expansion, and disciplined discounting to compete against faster rivals.`,
    insights: [
      ...insights,
      {
        agent: "Strategy",
        confidence: 86,
        finding:
          "Prioritize city-density expansion, loyalty-led basket growth, kirana/micro-fulfillment partnerships, and contribution-margin controls.",
        evidence: recommendations.slice(0, 3).map((recommendation) => recommendation.title),
      },
    ],
    plays: recommendations.slice(0, 4).map((recommendation) => ({
      title: recommendation.title,
      team:
        recommendation.motion === "Retention"
          ? "Customer Success"
          : recommendation.motion === "Marketing"
            ? "Marketing"
            : recommendation.motion === "Sales"
              ? "Sales"
              : "Growth",
      priority: recommendation.impact > 85 ? "High" : "Medium",
      action: recommendation.action,
    })),
  };
}
