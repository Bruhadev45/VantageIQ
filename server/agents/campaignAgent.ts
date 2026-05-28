import type { AgentInsight, MarketRequest } from "../../src/shared/contracts";
import { getMarketDataset } from "../db/repository";

export async function runCampaignAgent(request: MarketRequest): Promise<AgentInsight> {
  const { campaigns } = await getMarketDataset();
  const best = campaigns[0];

  return {
    agent: "Campaign",
    confidence: 82,
    finding: `${request.company} should test a ${request.horizon} city-density growth campaign modeled on "${best.name}", using local assortment, speed proof, and loyalty bundles before scaling discounts.`,
    evidence: [
      `${best.brand} reported ${best.lift} in demo campaign lift.`,
      `Winning pattern: ${best.pattern}.`,
      `Channel: ${best.channel}.`,
    ],
  };
}
