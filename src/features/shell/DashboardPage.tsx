import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddCompetitorDialog } from "../../components/AddCompetitorDialog";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { useDataset } from "../../hooks/useDataset";
import { useRunHistory } from "../../hooks/useRunHistory";
import { useRunStream } from "../../hooks/useRunStream";
import { createCompetitor, getRunById, ingestSource, listAlerts, runLiveResearch, runPdfUrl } from "../../services/apiClient";
import { generateMarketBrief } from "../../services/intelligenceEngine";
import type { MarketRequest, RunDetail } from "../../shared/contracts";
import { CampaignLab } from "../campaigns/CampaignLab";
import { ChannelMix } from "../campaigns/ChannelMix";
import { FastestMover } from "../command-center/FastestMover";
import { HeroPanel } from "../command-center/HeroPanel";
import { HowItWorks } from "../command-center/HowItWorks";
import { MetricsGrid } from "../command-center/MetricsGrid";
import { TrendRadar } from "../command-center/TrendRadar";
import { CompetitorMonitor } from "../competitors/CompetitorMonitor";
import { CounterStrategyMatrix } from "../competitors/CounterStrategyMatrix";
import { PostureRadar } from "../competitors/PostureRadar";
import { EvidenceLayer } from "../evidence/EvidenceLayer";
import { MissionBuilder } from "../mission/MissionBuilder";
import { BoardMemo } from "../strategy/BoardMemo";
import { ExecutiveNarrative } from "../strategy/ExecutiveNarrative";
import { ScenarioSimulator } from "../strategy/ScenarioSimulator";
import { StrategyRoom } from "../strategy/StrategyRoom";
import { MomentumForecast } from "../trends/MomentumForecast";
import { TrendDriversModal } from "../trends/TrendDriversModal";
import { AlertsPanel } from "../alerts/AlertsPanel";
import { AIChat } from "../chat/AIChat";
import { Sidebar, type SidebarView } from "./Sidebar";
import { Topbar } from "./Topbar";

type DashboardPageProps = {
  userEmail?: string;
  onLogout?: () => void;
};

export function DashboardPage({ userEmail, onLogout }: DashboardPageProps = {}) {
  const { dataset, status, loading, error, refresh } = useDataset();
  const stream = useRunStream();
  const { runs, refresh: refreshRuns } = useRunHistory(stream.state.status);

  const [activeView, setActiveView] = useState<SidebarView>("command-center");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [driversOpen, setDriversOpen] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [mission, setMission] = useState<MarketRequest>({
    market: "India quick commerce",
    company: "BigBasket BB Now",
    region: "India",
    objective: "Find growth opportunities and campaign ideas against faster quick-commerce rivals",
    horizon: "30 days",
    competitors: ["Blinkit", "Zepto", "Swiggy Instamart"],
    decisionType: "growth" as const,
    budgetRange: "Medium city launch budget",
    targetCustomer: "metro households buying weekly grocery and premium impulse items",
    channels: ["App CRM", "Loyalty"],
    sourceUrls: [],
  });

  const competitorNames = useMemo(() => {
    if (!dataset) return [];
    return dataset.competitors.map((competitor) => competitor.name);
  }, [dataset]);

  const brief = useMemo(() => {
    if (!dataset) return null;
    return generateMarketBrief("India quick commerce", dataset);
  }, [dataset]);

  useEffect(() => {
    let isMounted = true;
    listAlerts()
      .then((alerts) => {
        if (isMounted) setUnreadAlerts(alerts.filter((alert) => !alert.isRead).length);
      })
      .catch(() => {
        if (isMounted) setUnreadAlerts(0);
      });
    return () => {
      isMounted = false;
    };
  }, [activeView]);

  useEffect(() => {
    if (!stream.state.runId || stream.state.status !== "completed") return;
    getRunById(stream.state.runId)
      .then(setSelectedRun)
      .catch(() => {
        // The streamed result is still visible even if the persisted detail refresh fails.
      });
  }, [stream.state.runId, stream.state.status]);

  const buildRunRequest = (): MarketRequest => {
    const competitors = mission.competitors.length ? mission.competitors : competitorNames.slice(0, 8);
    const contextParts = [
      mission.objective,
      `Decision type: ${mission.decisionType}`,
      mission.targetCustomer ? `Target customer: ${mission.targetCustomer}` : "",
      mission.budgetRange ? `Budget: ${mission.budgetRange}` : "",
      mission.channels.length ? `Channels: ${mission.channels.join(", ")}` : "",
    ].filter(Boolean);

    return {
      ...mission,
      competitors,
      objective: contextParts.join(" | "),
    };
  };

  const triggerRun = async () => {
    if (!dataset) return;
    toast.message("Spinning up agents", { description: "Streaming live OpenAI reasoning." });
    const run = await stream.start(buildRunRequest());
    if (run) {
      setSelectedRun(run);
      refreshRuns();
    } else if (stream.state.error) {
      toast.error("Failed to start run", { description: stream.state.error });
    }
  };

  const handleExport = () => {
    const runId = stream.state.runId || selectedRun?.id;
    if (runId) {
      window.location.href = runPdfUrl(runId);
      toast.success("PDF export started");
      return;
    }

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

  const handleSelectRun = async (id: string) => {
    try {
      const run = await getRunById(id);
      setSelectedRun(run);
      toast.message("Run detail", { description: `Opened run ${id.slice(0, 8)}.` });
      setActiveView("strategy");
    } catch (err) {
      toast.error("Run detail failed", {
        description: err instanceof Error ? err.message : "Could not open this run.",
      });
    }
  };

  const handleAddCompetitor = async (name: string, category: string) => {
    try {
      await createCompetitor({ name, category });
      await refresh();
      toast.success(`Now tracking ${name}`, {
        description: "Added to your workspace. Run a live market scan to enrich its profile.",
      });
    } catch (err) {
      toast.error("Could not add competitor", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      throw err;
    }
  };

  const handleIngestSource = async (url: string) => {
    setIngesting(true);
    try {
      const result = await ingestSource({
        url,
        market: mission.market,
        competitor: mission.competitors[0],
      });
      toast.success("Source ingested", {
        description: result.extractedSignals[0] || result.source.title,
      });
      await refresh();
    } catch (err) {
      toast.error("Source ingestion failed", {
        description: err instanceof Error ? err.message : "Could not ingest that URL.",
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleLiveResearch = async () => {
    setScanning(true);
    try {
      const result = await runLiveResearch(buildRunRequest());
      toast.success("Live market scan complete", {
        description: `${result.sources.length} sources added via ${result.providers.join(", ") || "configured providers"}.`,
      });
      await refresh();
    } catch (err) {
      toast.error("Live market scan failed", {
        description: err instanceof Error ? err.message : "Could not run provider search.",
      });
    } finally {
      setScanning(false);
    }
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
            setActiveView("alerts")
          }
          notificationsCount={unreadAlerts}
          onSourcesAdded={refresh}
          userEmail={userEmail}
          onLogout={onLogout}
        />

        <ErrorBoundary>
          {activeView === "command-center" ? (
            <>
              <HeroPanel
                market={mission.market}
                competitors={competitors}
                sourcesCount={dataset.sources.length}
                isRunning={stream.state.status === "starting" || stream.state.status === "streaming"}
                onRun={triggerRun}
              />
              <HowItWorks />
              <MissionBuilder
                value={mission}
                competitorOptions={competitorNames}
                isRunning={stream.state.status === "starting" || stream.state.status === "streaming"}
                onChange={setMission}
                onRun={triggerRun}
              />
              <MetricsGrid dataset={dataset} />
              <section className="content-grid">
                <TrendRadar
                  trends={dataset.trends}
                  onViewDrivers={() => setDriversOpen(true)}
                />
                {fastest ? <FastestMover competitor={fastest} /> : null}
              </section>
            </>
          ) : null}

          {activeView === "competitors" ? (
            <>
              <section className="content-grid">
                <CompetitorMonitor
                  competitors={competitors}
                  searchQuery={searchQuery}
                  onAddCompetitor={() => setDialogOpen(true)}
                />
                <PostureRadar competitors={competitors} />
              </section>
              <CounterStrategyMatrix competitors={competitors} />
            </>
          ) : null}

          {activeView === "trends" ? (
            <section className="content-grid">
              <TrendRadar
                trends={dataset.trends}
                onViewDrivers={() => setDriversOpen(true)}
              />
              <MomentumForecast trends={dataset.trends} />
            </section>
          ) : null}

          {activeView === "campaigns" ? (
            <section className="content-grid">
              <CampaignLab campaigns={dataset.campaigns} searchQuery={searchQuery} />
              <ChannelMix trends={dataset.trends} />
            </section>
          ) : null}

          {activeView === "strategy" ? (
            <>
              <StrategyRoom
                recommendations={dataset.recommendations}
                stream={stream.state}
                mission={mission}
                sourcesCount={dataset.sources.length}
                onGenerate={triggerRun}
                onExport={handleExport}
              />
              <BoardMemo
                brief={brief}
                dataset={dataset}
                mission={mission}
                runResult={stream.state.result}
              />
              {selectedRun ? <RunDetailPanel run={selectedRun} /> : null}
              <section className="brief-section">
                <ExecutiveNarrative brief={brief} runResult={stream.state.result} />
                <MomentumForecast trends={dataset.trends} />
              </section>
              <section className="content-grid">
                <ScenarioSimulator mission={mission} competitors={competitorNames} />
                <AIChat market={mission.market} company={mission.company} competitors={mission.competitors} />
              </section>
            </>
          ) : null}

          {activeView === "alerts" ? (
            <AlertsPanel competitors={competitorNames} onUnreadChange={setUnreadAlerts} />
          ) : null}

          {activeView === "command-center" ? (
            <EvidenceLayer
              sources={dataset.sources}
              ingesting={ingesting}
              scanning={scanning}
              onIngestSource={handleIngestSource}
              onRunLiveResearch={handleLiveResearch}
            />
          ) : null}
        </ErrorBoundary>
      </section>

      <AddCompetitorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAddCompetitor}
      />

      <TrendDriversModal
        open={driversOpen}
        onClose={() => setDriversOpen(false)}
        trends={dataset.trends}
        sources={dataset.sources}
      />
    </main>
  );
}

function RunDetailPanel({ run }: { run: RunDetail }) {
  return (
    <section className="run-detail-panel">
      <div>
        <span className={`status-pill status-${run.status}`}>{run.status}</span>
        <h2>{run.company} intelligence run</h2>
        <p>{run.executiveSummary || "This run has not produced an executive summary yet."}</p>
      </div>
      <dl>
        <div>
          <dt>Market</dt>
          <dd>{run.market}</dd>
        </div>
        <div>
          <dt>Objective</dt>
          <dd>{run.objective}</dd>
        </div>
        <div>
          <dt>Competitors</dt>
          <dd>{run.competitors.join(", ") || "All tracked competitors"}</dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{new Date(run.startedAt).toLocaleString()}</dd>
        </div>
      </dl>
      {run.insights.length ? (
        <ul>
          {run.insights.map((insight) => (
            <li key={insight.agent}>
              <strong>{insight.agent}</strong>
              <span>{insight.finding}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
