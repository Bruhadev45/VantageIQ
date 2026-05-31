import { useEffect, useState } from "react";
import { FlaskConical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MarketCampaign } from "../../shared/contracts";
import { CampaignTestModal } from "./CampaignTestModal";
import { loadCampaignTests, saveCampaignTests, type CampaignTest } from "./campaignTests";

type Props = {
  campaigns: MarketCampaign[];
  searchQuery: string;
};

export function CampaignLab({ campaigns, searchQuery }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tests, setTests] = useState<CampaignTest[]>([]);

  useEffect(() => {
    setTests(loadCampaignTests());
  }, []);

  const persist = (next: CampaignTest[]) => {
    setTests(next);
    saveCampaignTests(next);
  };

  const handleCreate = (test: CampaignTest) => {
    persist([test, ...tests]);
    toast.success("Test created", { description: `${test.name} · projected +${test.projectedLift}% lift` });
  };

  const handleDelete = (id: string) => {
    persist(tests.filter((test) => test.id !== id));
  };

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? campaigns.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(query) ||
          campaign.brand.toLowerCase().includes(query) ||
          campaign.channel.toLowerCase().includes(query),
      )
    : campaigns;

  return (
    <article className="panel campaign-panel">
      <div className="panel-heading">
        <div>
          <span>Campaign Lab</span>
          <h2>Successful patterns to learn from</h2>
        </div>
        <button type="button" className="ghost-button" onClick={() => setModalOpen(true)}>
          <FlaskConical size={15} />
          Create test
        </button>
      </div>

      {tests.length > 0 ? (
        <div className="campaign-tests">
          <h3>Planned A/B tests</h3>
          <ul>
            {tests.map((test) => (
              <li key={test.id}>
                <div className="campaign-test-info">
                  <strong>{test.name}</strong>
                  <span>
                    {test.baseCampaign} → {test.variantChannel} · {test.metric} · {test.durationDays}d
                  </span>
                </div>
                <div className="campaign-test-metrics">
                  <span className="lift">+{test.projectedLift}%</span>
                  <span className="confidence">{test.confidence}% conf.</span>
                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => handleDelete(test.id)}
                    title="Delete test"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="campaign-list">
        {filtered.length === 0 ? (
          <p className="empty-state">No campaigns match "{searchQuery}".</p>
        ) : (
          filtered.map((campaign) => (
            <article className="campaign-card" key={campaign.id}>
              <div>
                <span>{campaign.brand}</span>
                <h3>{campaign.name}</h3>
              </div>
              <p>{campaign.whyItWorked}</p>
              <footer>
                <strong>{campaign.lift}</strong>
                <span>{campaign.channel}</span>
              </footer>
            </article>
          ))
        )}
      </div>

      <CampaignTestModal
        open={modalOpen}
        campaigns={campaigns}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </article>
  );
}
