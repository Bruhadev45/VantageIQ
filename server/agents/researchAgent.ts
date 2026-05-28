import type { AgentInsight, MarketRequest } from "../../src/shared/contracts";
import { getMarketDataset } from "../db/repository";

export async function runResearchAgent(request: MarketRequest): Promise<AgentInsight> {
  const { competitors } = await getMarketDataset();
  const fastest = [...competitors].sort((a, b) => b.growth - a.growth)[0];
  const namedCompetitors = request.competitors.length ? request.competitors.join(", ") : "tracked category leaders";

  return {
    agent: "Research",
    confidence: 87,
    finding: `${fastest.name} is the immediate benchmark in ${request.market}; compare ${request.company} against ${namedCompetitors} on switching friction, proof assets, and buyer-specific messaging.`,
    evidence: [
      `${fastest.name} shows ${fastest.growth}% growth in the seeded India quick-commerce dataset.`,
      `Strongest channel: ${fastest.fastestChannel}.`,
      `Strategic moat: ${fastest.moat}.`,
    ],
  };
}
