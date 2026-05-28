import { Crosshair, Shield, Swords, TrendingUp } from "lucide-react";
import type { MarketCompetitor } from "../../shared/contracts";

const vulnerabilities: Record<string, string> = {
  blinkit: "Dense-store economics can weaken outside top urban clusters.",
  zepto: "High-growth discounting creates margin and capital-efficiency pressure.",
  "swiggy-instamart": "Rapid city expansion can create fulfillment and contribution-margin drag.",
  "bigbasket-bbnow": "Trust is strong, but speed-led app frequency trails the top three.",
};

function getCounterMove(competitor: MarketCompetitor) {
  if (competitor.id === "blinkit") {
    return "Win selectively in underserved micro-markets with local assortment, faster fill rates, and member-only basket bundles.";
  }
  if (competitor.id === "zepto") {
    return "Counter youth acquisition with premium snack, beauty, and festival baskets that improve AOV instead of matching discounts blindly.";
  }
  if (competitor.id === "swiggy-instamart") {
    return "Attack cities where delivery reliability or assortment depth is weaker, using kirana supply nodes and stronger repeat-purchase offers.";
  }
  return "Use supply-chain trust, subscription value, and predictable grocery replenishment to defend against pure speed positioning.";
}

function urgencyFor(competitor: MarketCompetitor) {
  if (competitor.growth >= 100 || competitor.marketShare >= 30) return "Immediate";
  if (competitor.growth >= 50) return "Next 30 days";
  return "Monitor";
}

type Props = {
  competitors: MarketCompetitor[];
};

export function CounterStrategyMatrix({ competitors }: Props) {
  return (
    <section className="counter-section">
      <div className="panel-heading">
        <div>
          <span>Counter-Strategy Matrix</span>
          <h2>How to respond to each rival</h2>
        </div>
      </div>

      <div className="counter-grid">
        {competitors.map((competitor) => (
          <article className="counter-card" key={competitor.id}>
            <header>
              <div>
                <strong>{competitor.name}</strong>
                <span>{urgencyFor(competitor)}</span>
              </div>
              <TrendingUp size={18} />
            </header>
            <div className="counter-row">
              <Shield size={16} />
              <p>
                <strong>Advantage:</strong> {competitor.moat}
              </p>
            </div>
            <div className="counter-row">
              <Crosshair size={16} />
              <p>
                <strong>Opening:</strong> {vulnerabilities[competitor.id] || competitor.insight}
              </p>
            </div>
            <div className="counter-row">
              <Swords size={16} />
              <p>
                <strong>Counter move:</strong> {getCounterMove(competitor)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
