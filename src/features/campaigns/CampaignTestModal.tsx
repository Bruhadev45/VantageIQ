import { useMemo, useState } from "react";
import { FlaskConical, X } from "lucide-react";
import type { MarketCampaign } from "../../shared/contracts";
import { projectTest, type CampaignTest, type CampaignTestMetric } from "./campaignTests";

type Props = {
  open: boolean;
  campaigns: MarketCampaign[];
  onClose: () => void;
  onCreate: (test: CampaignTest) => void;
};

const METRICS: CampaignTestMetric[] = ["Conversion rate", "Average order value", "Retention", "Click-through rate"];
const CHANNELS = ["App CRM", "Paid social", "Creator", "Search", "Loyalty", "Pricing"];

export function CampaignTestModal({ open, campaigns, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [baseCampaign, setBaseCampaign] = useState(campaigns[0]?.name ?? "");
  const [variantChannel, setVariantChannel] = useState(CHANNELS[0]);
  const [metric, setMetric] = useState<CampaignTestMetric>("Conversion rate");
  const [splitPercent, setSplitPercent] = useState(50);
  const [durationDays, setDurationDays] = useState(14);
  const [hypothesis, setHypothesis] = useState("");

  // Live projection preview as the user adjusts inputs.
  const projection = useMemo(
    () => projectTest({ metric, variantChannel, splitPercent, durationDays }),
    [metric, variantChannel, splitPercent, durationDays],
  );

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const test: CampaignTest = {
      id: `test-${Date.now().toString(36)}`,
      name: name.trim(),
      baseCampaign: baseCampaign || campaigns[0]?.name || "Baseline",
      variantChannel,
      metric,
      splitPercent,
      durationDays,
      hypothesis: hypothesis.trim() || `${variantChannel} variant lifts ${metric.toLowerCase()} vs. the baseline.`,
      ...projection,
      status: "planned",
      createdAt: new Date().toISOString(),
    };
    onCreate(test);
    setName("");
    setHypothesis("");
    onClose();
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="test-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="drivers-header">
          <div>
            <span className="eyebrow">Campaign Lab · A/B Planner</span>
            <h2>Design a campaign test</h2>
            <p>Define a variant against a proven pattern and preview the projected lift before you spend.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="test-grid">
          <label>
            Test name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Loyalty bundle vs. flat discount" autoFocus />
          </label>
          <label>
            Base pattern
            <select value={baseCampaign} onChange={(e) => setBaseCampaign(e.target.value)}>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.name}>
                  {campaign.brand} · {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Variant channel
            <select value={variantChannel} onChange={(e) => setVariantChannel(e.target.value)}>
              {CHANNELS.map((channel) => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </label>
          <label>
            Primary metric
            <select value={metric} onChange={(e) => setMetric(e.target.value as CampaignTestMetric)}>
              {METRICS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Traffic split to variant: {splitPercent}%
            <input type="range" min={10} max={90} step={5} value={splitPercent} onChange={(e) => setSplitPercent(Number(e.target.value))} />
          </label>
          <label>
            Duration (days)
            <input type="number" min={3} max={90} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
          </label>
          <label className="wide">
            Hypothesis
            <input value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="What do you expect to happen and why?" />
          </label>
        </div>

        <div className="test-projection">
          <div>
            <span>Projected lift</span>
            <strong>+{projection.projectedLift}%</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{projection.confidence}%</strong>
          </div>
          <div>
            <span>Read-out in</span>
            <strong>{durationDays} days</strong>
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={!name.trim()}>
            <FlaskConical size={16} />
            Create test
          </button>
        </div>
      </form>
    </div>
  );
}
