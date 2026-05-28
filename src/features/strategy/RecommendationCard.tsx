import { ShieldCheck } from "lucide-react";
import type { MarketRecommendation } from "../../shared/contracts";

type Props = {
  recommendation: MarketRecommendation;
};

export function RecommendationCard({ recommendation }: Props) {
  return (
    <article className="recommendation-card">
      <div className="recommendation-topline">
        <span>{recommendation.motion}</span>
        <div>
          <strong>{recommendation.impact}</strong>
          <small>impact</small>
        </div>
      </div>
      <h3>{recommendation.title}</h3>
      <p>{recommendation.action}</p>
      <footer>
        <ShieldCheck size={16} />
        {recommendation.confidence}% confidence
      </footer>
    </article>
  );
}
