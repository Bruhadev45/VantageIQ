import { Building2, Megaphone, TrendingUp, Zap } from "lucide-react";
import { MetricCard } from "../../components/MetricCard";
import type { MarketDatasetResponse } from "../../shared/contracts";
import { calculateOpportunityScore } from "../../services/intelligenceEngine";

type Props = {
  dataset: MarketDatasetResponse;
};

export function MetricsGrid({ dataset }: Props) {
  const opportunity = calculateOpportunityScore(dataset);
  const trackedCount = dataset.competitors.length;
  const trendCount = dataset.trends.length;
  const campaignCount = dataset.campaigns.length;
  const latestTrend = dataset.trends[dataset.trends.length - 1];
  const previousTrend = dataset.trends[dataset.trends.length - 2];
  const trendDelta =
    latestTrend && previousTrend && previousTrend.quickCommerce !== 0
      ? Math.round(((latestTrend.quickCommerce - previousTrend.quickCommerce) / previousTrend.quickCommerce) * 100)
      : 0;

  return (
    <section className="metrics-grid">
      <MetricCard
        label="Tracked competitors"
        value={trackedCount.toString()}
        change="Live from database"
        icon={Building2}
        tone="green"
      />
      <MetricCard
        label="Trend signals"
        value={trendCount.toString()}
        change={`${trendDelta >= 0 ? "+" : ""}${trendDelta}% MoM`}
        icon={TrendingUp}
        tone="amber"
      />
      <MetricCard
        label="Campaign patterns"
        value={campaignCount.toString()}
        change="Tracked & explainable"
        icon={Megaphone}
        tone="coral"
      />
      <MetricCard
        label="Opportunity score"
        value={opportunity.toString()}
        change="High-priority market"
        icon={Zap}
        tone="violet"
      />
    </section>
  );
}
