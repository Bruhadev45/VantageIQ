import type { AgentInsight, MarketRequest } from "../../src/shared/contracts";
import { getMarketDataset } from "../db/repository";

export async function runTrendAgent(request: MarketRequest): Promise<AgentInsight> {
  const { trends } = await getMarketDataset();
  const latest = trends[trends.length - 1];
  const previous = trends[trends.length - 2];
  const acceleration = latest.quickCommerce - previous.quickCommerce;

  return {
    agent: "Trend",
    confidence: 84,
    finding: `${request.market} buyers are responding to ultra-fast delivery, premium baskets, and loyalty bundles; quick-commerce signal rose ${acceleration} points in the latest period.`,
    evidence: [
      `Quick-commerce signal: ${latest.quickCommerce}.`,
      `Premium products signal: ${latest.premiumProducts}.`,
      `Loyalty signal: ${latest.loyalty}.`,
    ],
  };
}
