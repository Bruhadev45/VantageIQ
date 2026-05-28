import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Building2,
  ChevronDown,
  ClipboardList,
  Download,
  LineChart as LineChartIcon,
  Megaphone,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  campaigns,
  competitors,
  radarData,
  recommendations,
  trendData,
  type Competitor,
  type Recommendation,
} from "./data/market";
import type { AgentRunResult, MarketSourceSummary } from "./shared/contracts";
import { getApiHealth, getMarketDataset, runAgents } from "./services/apiClient";
import { calculateOpportunityScore, generateMarketBrief } from "./services/intelligenceEngine";

const navItems = [
  { label: "Command Center", icon: BarChart3 },
  { label: "Competitors", icon: Building2 },
  { label: "Trend Radar", icon: LineChartIcon },
  { label: "Campaign Lab", icon: Megaphone },
  { label: "AI Strategy Room", icon: BrainCircuit },
];

const formatSigned = (value: number) => `+${value}%`;

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  icon: typeof TrendingUp;
  tone: "green" | "amber" | "coral" | "violet";
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{change}</span>
      </div>
    </article>
  );
}

function CompetitorRow({ competitor }: { competitor: Competitor }) {
  return (
    <article className="competitor-row">
      <div className="company-lockup">
        <span>{competitor.name.slice(0, 2)}</span>
        <div>
          <strong>{competitor.name}</strong>
          <p>{competitor.category}</p>
        </div>
      </div>
      <div className="progress-stack">
        <div>
          <span>Growth</span>
          <strong>{formatSigned(competitor.growth)}</strong>
        </div>
        <progress value={competitor.growth} max="35" />
      </div>
      <div className="progress-stack">
        <div>
          <span>Engagement</span>
          <strong>{competitor.engagement}</strong>
        </div>
        <progress value={competitor.engagement} max="100" />
      </div>
      <div className={`risk-pill ${competitor.risk.toLowerCase()}`}>{competitor.risk} threat</div>
    </article>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
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

function App() {
  const topCompetitor = competitors[1];
  const opportunityScore = calculateOpportunityScore();
  const marketBrief = generateMarketBrief();
  const [agentResult, setAgentResult] = useState<AgentRunResult | null>(null);
  const [sources, setSources] = useState<MarketSourceSummary[]>([]);
  const [apiStatus, setApiStatus] = useState<"connecting" | "live" | "demo">("connecting");

  useEffect(() => {
    let isMounted = true;

    async function loadAgentIntelligence() {
      try {
        const health = await getApiHealth();
        const result = await runAgents({
          market: "India quick commerce",
          company: "VantageIQ customer",
          competitors: competitors.map((competitor) => competitor.name),
        });
        const dataset = await getMarketDataset();

        if (isMounted) {
          setAgentResult(result);
          setSources(dataset.sources);
          setApiStatus(health.openaiConfigured && result.mode === "live-openai" ? "live" : "demo");
        }
      } catch {
        if (isMounted) {
          setApiStatus("demo");
        }
      }
    }

    loadAgentIntelligence();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <strong>VantageIQ</strong>
            <span>AI Market Analyst</span>
          </div>
        </div>

        <nav>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button className={index === 0 ? "active" : ""} key={item.label}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <section className="brief-card">
          <Bot size={20} />
          <h2>Analyst Brief</h2>
          <p>3 competitor moves require action this week.</p>
          <button>
            Generate brief
            <ArrowUpRight size={16} />
          </button>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input aria-label="Search market intelligence" placeholder="Search companies, campaigns, trends..." />
          </div>
          <button className={`market-select status-${apiStatus}`}>
            {apiStatus === "live" ? "OpenAI agents live" : apiStatus === "connecting" ? "Connecting API" : "Demo agents"}
            <ChevronDown size={16} />
          </button>
          <button className="icon-button" aria-label="Notifications">
            <Bell size={19} />
          </button>
          <button className="export-button">
            <Download size={17} />
            Export
          </button>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Live competitive intelligence</span>
            <h1>Decode India’s quick-commerce race, then turn competitor signals into sharper growth moves.</h1>
            <p>
              VantageIQ studies Blinkit, Zepto, Swiggy Instamart, and emerging challengers across market share,
              campaign patterns, city expansion, basket behavior, and customer engagement.
            </p>
          </div>
          <div className="signal-board" aria-label="AI signal workflow visualization">
            <div className="signal-node source">Sources</div>
            <div className="signal-node model">AI Pattern Engine</div>
            <div className="signal-node action">Growth Plays</div>
            <span className="signal-line one" />
            <span className="signal-line two" />
          </div>
        </section>

        <section className="metrics-grid">
          <MetricCard label="Tracked competitors" value="128" change="+14 this week" icon={Building2} tone="green" />
          <MetricCard label="Growth signals" value="2,847" change="+22% signal volume" icon={TrendingUp} tone="amber" />
          <MetricCard label="Campaign patterns" value="416" change="+31 analyzed" icon={Megaphone} tone="coral" />
          <MetricCard
            label="Opportunity score"
            value={opportunityScore.toString()}
            change="High-priority market"
            icon={Zap}
            tone="violet"
          />
        </section>

        <section className="content-grid">
          <article className="panel large-panel">
            <div className="panel-heading">
              <div>
                <span>Trend Radar</span>
                <h2>Demand signals across the market</h2>
              </div>
              <button className="ghost-button">View drivers</button>
            </div>
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="quickCommerce" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="premiumProducts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="quickCommerce"
                    name="Quick commerce"
                    stroke="#10b981"
                    fill="url(#quickCommerce)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="premiumProducts"
                    name="Premium products"
                    stroke="#f97316"
                    fill="url(#premiumProducts)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading compact">
              <div>
                <span>Fastest mover</span>
                <h2>{topCompetitor.name}</h2>
              </div>
              <div className="score-badge">{formatSigned(topCompetitor.growth)}</div>
            </div>
            <p className="insight-copy">{topCompetitor.insight}</p>
            <div className="reason-list">
              <div>
                <Target size={17} />
                <span>{topCompetitor.fastestChannel}</span>
              </div>
              <div>
                <Users size={17} />
                <span>{topCompetitor.moat}</span>
              </div>
              <div>
                <ClipboardList size={17} />
                <span>{topCompetitor.pricing} pricing motion</span>
              </div>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel table-panel">
            <div className="panel-heading">
              <div>
                <span>Competitor Monitor</span>
                <h2>Where rivals are gaining ground</h2>
              </div>
              <button className="ghost-button">Add competitor</button>
            </div>
            <div className="competitor-list">
              {competitors.map((competitor) => (
                <CompetitorRow competitor={competitor} key={competitor.name} />
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading compact">
              <div>
                <span>Competitive posture</span>
                <h2>Relative strength map</h2>
              </div>
            </div>
            <div className="radar-frame">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#d8dee9" />
                  <PolarAngleAxis dataKey="company" tick={{ fontSize: 11 }} />
                  <Radar dataKey="Sentiment" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.18} />
                  <Radar dataKey="Engagement" stroke="#0f766e" fill="#0f766e" fillOpacity={0.14} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel campaign-panel">
            <div className="panel-heading">
              <div>
                <span>Campaign Lab</span>
                <h2>Successful patterns to learn from</h2>
              </div>
              <button className="ghost-button">Create test</button>
            </div>
            <div className="campaign-list">
              {campaigns.map((campaign) => (
                <article className="campaign-card" key={campaign.name}>
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
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading compact">
              <div>
                <span>Channel Mix</span>
                <h2>Where demand is shifting</h2>
              </div>
            </div>
            <div className="chart-frame small">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData.slice(2)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="premiumProducts" name="Premium products" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="festiveDemand" name="Festive demand" fill="#eab308" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="strategy-section">
          <div className="panel-heading">
            <div>
              <span>AI Strategy Room</span>
                <h2>Recommended moves for Indian quick commerce</h2>
            </div>
            <button className="primary-button">
              <Sparkles size={17} />
              Generate board brief
            </button>
          </div>
          <div className="recommendation-grid">
            {recommendations.map((recommendation) => (
              <RecommendationCard recommendation={recommendation} key={recommendation.title} />
            ))}
          </div>
        </section>

        <section className="brief-section">
          <article className="panel narrative-panel">
            <div className="panel-heading">
              <div>
                <span>Executive Narrative</span>
                <h2>Why some companies are pulling ahead</h2>
              </div>
            </div>
            <div className="narrative-grid">
              <p>{agentResult?.executiveSummary || marketBrief.summary}</p>
              {(agentResult?.insights.map((insight) => insight.finding) || marketBrief.growthExplanation)
                .slice(0, 2)
                .map((point) => (
                <p key={point}>{point}</p>
                ))}
            </div>
          </article>

          <article className="panel line-panel">
            <div className="panel-heading compact">
              <div>
                <span>Momentum Forecast</span>
                <h2>Projected category pull</h2>
              </div>
            </div>
            <div className="chart-frame small">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="quickCommerce"
                    name="Quick commerce"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line type="monotone" dataKey="loyalty" name="Loyalty" stroke="#dc2626" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="source-section">
          <div className="panel-heading">
            <div>
              <span>Evidence Layer</span>
              <h2>Source-backed India market data</h2>
            </div>
          </div>
          <div className="source-grid">
            {(sources.length
              ? sources
              : [
                  {
                    title: "India's E-commerce and Quick Commerce Market",
                    publisher: "USDA Foreign Agricultural Service",
                    url: "https://apps.fas.usda.gov/",
                    date: "2025",
                    notes: "India quick-commerce market sizing and adoption context.",
                  },
                  {
                    title: "FY25 quick-commerce market share",
                    publisher: "Indira Securities",
                    url: "https://www.indiratrade.com/",
                    date: "2025",
                    notes: "Blinkit, Zepto, Instamart, and others market share context.",
                  },
                ]).map((source) => (
              <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={source.title}>
                <span>{source.publisher}</span>
                <strong>{source.title}</strong>
                <p>{source.notes}</p>
                <small>{source.date}</small>
              </a>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
