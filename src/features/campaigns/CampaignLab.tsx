import type { MarketCampaign } from "../../shared/contracts";

type Props = {
  campaigns: MarketCampaign[];
  searchQuery: string;
  onCreateTest: () => void;
};

export function CampaignLab({ campaigns, searchQuery, onCreateTest }: Props) {
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
        <button type="button" className="ghost-button" onClick={onCreateTest}>
          Create test
        </button>
      </div>
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
    </article>
  );
}
