import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AddCompetitorDialog } from "../../components/AddCompetitorDialog";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { useDataset } from "../../hooks/useDataset";
import { useRunHistory } from "../../hooks/useRunHistory";
import { useRunStream } from "../../hooks/useRunStream";
import { generateMarketBrief } from "../../services/intelligenceEngine";
import { CampaignLab } from "../campaigns/CampaignLab";
import { ChannelMix } from "../campaigns/ChannelMix";
import { FastestMover } from "../command-center/FastestMover";
import { HeroPanel } from "../command-center/HeroPanel";
import { MetricsGrid } from "../command-center/MetricsGrid";
import { TrendRadar } from "../command-center/TrendRadar";
import { CompetitorMonitor } from "../competitors/CompetitorMonitor";
import { PostureRadar } from "../competitors/PostureRadar";
import { EvidenceLayer } from "../evidence/EvidenceLayer";
import { ExecutiveNarrative } from "../strategy/ExecutiveNarrative";
import { StrategyRoom } from "../strategy/StrategyRoom";
import { MomentumForecast } from "../trends/MomentumForecast";
import { Sidebar, type SidebarView } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardPage() {
  const { dataset, status, loading, error } = useDataset();
  const stream = useRunStream();
  const { runs, refresh: refreshRuns } = useRunHistory(stream.state.status);

  const [activeView, setActiveView] = useState<SidebarView>("command-center");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extraCompetitors, setExtraCompetitors] = useState<string[]>([]);

  const competitorNames = useMemo(() => {
    if (!dataset) return extraCompetitors;
    return [...dataset.competitors.map((competitor) => competitor.name), ...extraCompetitors];
  }, [dataset, extraCompetitors]);

  const brief = useMemo(() => {
    if (!dataset) return null;
    return generateMarketBrief("India quick commerce", dataset);
  }, [dataset]);

  const triggerRun = async () => {
    if (!dataset) return;
    toast.message("Spinning up agents", { description: "Streaming live OpenAI reasoning." });
    const run = await stream.start({
      market: "India quick commerce",
      company: "VantageIQ customer",
      competitors: competitorNames.slice(0, 8),
    });
    if (run) {
      refreshRuns();
    } else if (stream.state.error) {
      toast.error("Failed to start run", { description: stream.state.error });
    }
  };

  const handleExport = () => {
    const result = stream.state.result;
    if (!result) {
      toast.error("Nothing to export yet", { description: "Generate a board brief first." });
      return;
    }
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vantageiq-run-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Brief exported");
  };

  const handleSelectRun = (id: string) => {
    toast.message("Run detail", { description: `Opening run ${id.slice(0, 8)}…` });
    setActiveView("strategy");
  };

  const handleAddCompetitor = (name: string) => {
    setExtraCompetitors((prev) => [...prev, name]);
    toast.success(`Tracking ${name}`, { description: "Will be included in the next agent run." });
  };

  if (loading) {
    return (
      <main className="app-shell loading-state">
        <div>
          <div className="spinner" />
          <p>Loading market intelligence…</p>
        </div>
      </main>
    );
  }

  if (error || !dataset || !brief) {
    return (
      <main className="app-shell loading-state">
        <div>
          <h2>API unreachable</h2>
          <p>{error || "The VantageIQ API did not respond. Start the server with `npm run dev:api`."}</p>
        </div>
      </main>
    );
  }

  const competitors = dataset.competitors;
  const fastest = [...competitors].sort((a, b) => b.growth - a.growth)[0];

  return (
    <main className="app-shell">
      <Sidebar
        active={activeView}
        onChange={setActiveView}
        onGenerateBrief={triggerRun}
        pendingActions={Math.max(1, runs.filter((run) => run.status === "completed").length)}
      />

      <section className="workspace">
        <Topbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          apiStatus={status}
          recentRuns={runs}
          onSelectRun={handleSelectRun}
          onExport={handleExport}
          onShowNotifications={() =>
            toast.message("No new alerts", { description: "Alert rules ship in Phase 4." })
          }
          notificationsCount={runs.filter((run) => run.status === "failed").length}
        />

        <ErrorBoundary>
          {activeView === "command-center" ? (
            <>
              <HeroPanel />
              <MetricsGrid dataset={dataset} />
              <section className="content-grid">
                <TrendRadar
                  trends={dataset.trends}
                  onViewDrivers={() => toast.message("Trend drivers", { description: "Detailed drilldowns coming." })}
                />
                {fastest ? <FastestMover competitor={fastest} /> : null}
              </section>
            </>
          ) : null}

          {activeView === "competitors" ? (
            <section className="content-grid">
              <CompetitorMonitor
                competitors={competitors}
                searchQuery={searchQuery}
                onAddCompetitor={() => setDialogOpen(true)}
              />
              <PostureRadar competitors={competitors} />
            </section>
          ) : null}

          {activeView === "trends" ? (
            <section className="content-grid">
              <TrendRadar
                trends={dataset.trends}
                onViewDrivers={() => toast.message("Trend drivers", { description: "Detailed drilldowns coming." })}
              />
              <MomentumForecast trends={dataset.trends} />
            </section>
          ) : null}

          {activeView === "campaigns" ? (
            <section className="content-grid">
              <CampaignLab
                campaigns={dataset.campaigns}
                searchQuery={searchQuery}
                onCreateTest={() =>
                  toast.message("Campaign tests", { description: "Will be wired with A/B engine in Phase 5." })
                }
              />
              <ChannelMix trends={dataset.trends} />
            </section>
          ) : null}

          {activeView === "strategy" ? (
            <>
              <StrategyRoom
                recommendations={dataset.recommendations}
                stream={stream.state}
                onGenerate={triggerRun}
              />
              <section className="brief-section">
                <ExecutiveNarrative brief={brief} runResult={stream.state.result} />
                <MomentumForecast trends={dataset.trends} />
              </section>
            </>
          ) : null}

          {activeView === "command-center" ? <EvidenceLayer sources={dataset.sources} /> : null}
        </ErrorBoundary>
      </section>

      <AddCompetitorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAddCompetitor}
      />
    </main>
  );
}
