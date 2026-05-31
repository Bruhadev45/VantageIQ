import { ArrowUpRight, BarChart3, Bell, Bot, BrainCircuit, Building2, LineChart as LineChartIcon, Megaphone, Sparkles } from "lucide-react";

export type SidebarView = "command-center" | "competitors" | "trends" | "campaigns" | "strategy" | "alerts";

const NAV_ITEMS: { label: string; view: SidebarView; icon: typeof BarChart3 }[] = [
  { label: "Command Center", view: "command-center", icon: BarChart3 },
  { label: "Competitors", view: "competitors", icon: Building2 },
  { label: "Trend Radar", view: "trends", icon: LineChartIcon },
  { label: "Campaign Lab", view: "campaigns", icon: Megaphone },
  { label: "AI Strategy Room", view: "strategy", icon: BrainCircuit },
  { label: "Alerts", view: "alerts", icon: Bell },
];

type Props = {
  active: SidebarView;
  onChange: (view: SidebarView) => void;
  onGenerateBrief: () => void;
  pendingActions: number;
};

export function Sidebar({ active, onChange, onGenerateBrief, pendingActions }: Props) {
  return (
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
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              className={item.view === active ? "active" : ""}
              key={item.view}
              onClick={() => onChange(item.view)}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <section className="brief-card">
        <Bot size={20} />
        <h2>Analyst Brief</h2>
        <p>
          {pendingActions} competitor move{pendingActions === 1 ? "" : "s"} surfaced. Generate a board-ready brief in
          one click.
        </p>
        <button type="button" onClick={onGenerateBrief}>
          Generate brief
          <ArrowUpRight size={16} />
        </button>
      </section>
    </aside>
  );
}
