import { prisma } from "./client";

export async function getMarketDataset() {
  const [competitors, trends, campaigns, recommendations, sources] = await Promise.all([
    prisma.competitor.findMany({ orderBy: { marketShare: "desc" } }),
    prisma.trendSignal.findMany({ orderBy: { period: "asc" } }),
    prisma.campaignPattern.findMany(),
    prisma.recommendation.findMany({ orderBy: { impact: "desc" } }),
    prisma.marketSource.findMany({ orderBy: { date: "desc" } }),
  ]);

  return { competitors, trends, campaigns, recommendations, sources };
}
