import {
  BrainCircuit,
  Building2,
  CalendarClock,
  DollarSign,
  Globe2,
  Radio,
  Target,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import type { MarketRequest } from "../../shared/contracts";

type Props = {
  value: MarketRequest;
  competitorOptions: string[];
  isRunning: boolean;
  onChange: (value: MarketRequest) => void;
  onRun: () => void;
};

export function MissionBuilder({ value, competitorOptions, isRunning, onChange, onRun }: Props) {
  const update = <K extends keyof MarketRequest>(key: K, nextValue: MarketRequest[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const toggleCompetitor = (name: string) => {
    const competitors = value.competitors.includes(name)
      ? value.competitors.filter((competitor) => competitor !== name)
      : [...value.competitors, name].slice(0, 8);
    update("competitors", competitors);
  };

  const toggleChannel = (name: string) => {
    const channels = value.channels.includes(name)
      ? value.channels.filter((channel) => channel !== name)
      : [...value.channels, name].slice(0, 8);
    update("channels", channels);
  };

  const channelOptions = ["App CRM", "Paid social", "Creator", "Search", "Partnerships", "Pricing", "Loyalty"];

  return (
    <section className="mission-builder">
      <div className="mission-copy">
        <span className="eyebrow">Analyst mission</span>
        <h1>Give VantageIQ a market question. Watch the agents turn it into a growth strategy.</h1>
        <div className="mission-pipeline" aria-label="Agent workflow">
          <div>
            <BrainCircuit size={18} />
            Research
          </div>
          <div>
            <Target size={18} />
            Trends
          </div>
          <div>
            <Zap size={18} />
            Strategy
          </div>
        </div>
      </div>

      <form
        className="mission-form"
        onSubmit={(event) => {
          event.preventDefault();
          onRun();
        }}
      >
        <label>
          <span>
            <Building2 size={15} />
            Company
          </span>
          <input
            value={value.company}
            onChange={(event) => update("company", event.target.value)}
            placeholder="e.g. BigBasket BB Now"
          />
        </label>

        <label>
          <span>
            <Globe2 size={15} />
            Market
          </span>
          <input
            value={value.market}
            onChange={(event) => update("market", event.target.value)}
            placeholder="e.g. India quick commerce"
          />
        </label>

        <label className="wide">
          <span>
            <Target size={15} />
            Goal
          </span>
          <input
            value={value.objective}
            onChange={(event) => update("objective", event.target.value)}
            placeholder="Find growth opportunities and campaign ideas"
          />
        </label>

        <label>
          <span>
            <Globe2 size={15} />
            Region
          </span>
          <input value={value.region} onChange={(event) => update("region", event.target.value)} />
        </label>

        <label>
          <span>
            <CalendarClock size={15} />
            Horizon
          </span>
          <select value={value.horizon} onChange={(event) => update("horizon", event.target.value)}>
            <option>7 days</option>
            <option>30 days</option>
            <option>90 days</option>
            <option>2 quarters</option>
          </select>
        </label>

        <label>
          <span>
            <Target size={15} />
            Decision
          </span>
          <select value={value.decisionType} onChange={(event) => update("decisionType", event.target.value as MarketRequest["decisionType"])}>
            <option value="growth">Growth</option>
            <option value="pricing">Pricing</option>
            <option value="campaign">Campaign</option>
            <option value="product">Product</option>
            <option value="market-entry">Market entry</option>
            <option value="board-brief">Board brief</option>
          </select>
        </label>

        <label>
          <span>
            <DollarSign size={15} />
            Budget
          </span>
          <select value={value.budgetRange} onChange={(event) => update("budgetRange", event.target.value)}>
            <option value="">Not specified</option>
            <option>Low pilot budget</option>
            <option>Medium city launch budget</option>
            <option>High growth budget</option>
            <option>Enterprise expansion budget</option>
          </select>
        </label>

        <label className="wide">
          <span>
            <UserRound size={15} />
            Target customer
          </span>
          <input
            value={value.targetCustomer}
            onChange={(event) => update("targetCustomer", event.target.value)}
            placeholder="e.g. metro families buying weekly staples"
          />
        </label>

        <fieldset className="competitor-picker">
          <legend>
            <Radio size={15} />
            Channels
          </legend>
          <div>
            {channelOptions.map((channel) => (
              <button
                type="button"
                className={value.channels.includes(channel) ? "selected" : ""}
                key={channel}
                onClick={() => toggleChannel(channel)}
              >
                {channel}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="competitor-picker">
          <legend>
            <Users size={15} />
            Competitors
          </legend>
          <div>
            {competitorOptions.map((competitor) => (
              <button
                type="button"
                className={value.competitors.includes(competitor) ? "selected" : ""}
                key={competitor}
                onClick={() => toggleCompetitor(competitor)}
              >
                {competitor}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="primary-button mission-submit" disabled={isRunning}>
          <BrainCircuit size={17} />
          {isRunning ? "Agents running..." : "Run AI analyst team"}
        </button>
      </form>
    </section>
  );
}
