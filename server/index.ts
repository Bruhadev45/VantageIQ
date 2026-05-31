import "./env";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import {
  ChatRequestSchema,
  CreateCompetitorSchema,
  MarketRequestSchema,
  ScenarioSimulatorRequestSchema,
  SourceIngestionSchema,
} from "../src/shared/contracts";
import { generateMarketBrief } from "../src/services/intelligenceEngine";
import {
  createRun,
  createCompetitor,
  getMarketDataset,
  getRun,
  listRuns,
  updateRun,
  listAlerts,
  markAlertRead,
  markAllAlertsRead,
  listAlertRules,
  createAlertRule,
  toggleAlertRule,
  deleteAlertRule,
  checkAlertRules,
} from "./db/repository";
import { runOpenAIStrategyAgents, streamStrategyRun, chatWithAI } from "./openaiClient";
import { runLiveResearch } from "./researchProviders";
import { ingestSource } from "./sourceIngestor";
import { generateBoardMemoPDF, generateMemoFilename } from "./pdfGenerator";
import { simulateScenario } from "./strategySimulator";
import { registerAuthGuard, registerAuthRoutes } from "./auth";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8787);
const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5174",
]);

await app.register(cors, {
  origin: Array.from(allowedOrigins),
  credentials: true,
});

// Centralized error handling: validation errors become 400s with details,
// everything else a clean 500 — so no endpoint leaks an unformatted crash.
app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    reply.code(400);
    return { error: "Invalid request", details: error.flatten() };
  }
  request.log.error({ err: error }, "Request failed");
  const err = error as { statusCode?: number; message?: string };
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  reply.code(statusCode);
  return { error: statusCode >= 500 ? "Internal server error" : err.message ?? "Request failed" };
});

// Authentication: a bearer-token guard for mutations + signup/login/me routes.
registerAuthGuard(app);
registerAuthRoutes(app);

app.get("/api/health", async () => ({
  ok: true,
  service: "vantageiq-api",
  openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
  providers: {
    exa: Boolean(process.env.EXA_API_KEY),
    serpapi: Boolean(process.env.SERPAPI_API_KEY),
    firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
  },
}));

app.get("/api/intelligence/dataset", async () => {
  return getMarketDataset();
});

app.post("/api/intelligence/brief", async (request) => {
  const payload = MarketRequestSchema.parse(request.body ?? {});
  const dataset = await getMarketDataset();
  return {
    brief: generateMarketBrief(payload.market, dataset),
  };
});

app.post("/api/intelligence/agents/run", async (request) => {
  const payload = MarketRequestSchema.parse(request.body ?? {});
  return runOpenAIStrategyAgents(payload);
});

app.post("/api/intelligence/sources/ingest", async (request, reply) => {
  const payload = SourceIngestionSchema.parse(request.body ?? {});
  const result = await ingestSource(payload);
  reply.code(201);
  return result;
});

app.post("/api/intelligence/research/live", async (request, reply) => {
  const payload = MarketRequestSchema.parse(request.body ?? {});
  const result = await runLiveResearch(payload);
  reply.code(201);
  return result;
});

app.post("/api/intelligence/scenario", async (request) => {
  const payload = ScenarioSimulatorRequestSchema.parse(request.body ?? {});
  return simulateScenario(payload);
});

// AI Chat endpoint
app.post("/api/intelligence/chat", async (request) => {
  const { message, history, context } = ChatRequestSchema.parse(request.body ?? {});
  const marketContext = MarketRequestSchema.parse({
    market: context?.market || "India quick commerce",
    company: context?.company || "Your Company",
    region: context?.region || "India",
    objective: context?.objective || "Market share growth",
    horizon: context?.horizon || "90 days",
    competitors: context?.competitors || [],
  });
  const response = await chatWithAI(message, marketContext, history);
  return { response };
});

// Competitor comparison endpoint
app.post("/api/intelligence/compare", async (request) => {
  const { competitors: competitorNames } = request.body as { competitors: string[] };
  const { competitors } = await getMarketDataset();
  const filtered = competitors.filter(c =>
    competitorNames.some(name => c.name.toLowerCase().includes(name.toLowerCase()))
  );

  if (filtered.length < 2) {
    return { error: "Need at least 2 competitors to compare", competitors: filtered };
  }

  const comparison = {
    competitors: filtered.map(c => ({
      name: c.name,
      growth: c.growth,
      marketShare: c.marketShare,
      sentiment: c.sentiment,
      moat: c.moat,
      risk: c.risk,
    })),
    winner: filtered.sort((a, b) => b.growth - a.growth)[0]?.name,
    insights: [
      `Highest growth: ${filtered.sort((a, b) => b.growth - a.growth)[0]?.name} at ${filtered.sort((a, b) => b.growth - a.growth)[0]?.growth}%`,
      `Largest market share: ${filtered.sort((a, b) => b.marketShare - a.marketShare)[0]?.name} at ${filtered.sort((a, b) => b.marketShare - a.marketShare)[0]?.marketShare}%`,
      `Best sentiment: ${filtered.sort((a, b) => b.sentiment - a.sentiment)[0]?.name} at ${filtered.sort((a, b) => b.sentiment - a.sentiment)[0]?.sentiment}/100`,
    ],
  };

  return comparison;
});

// Persist a user-added competitor so it shows across every view and future runs.
app.post("/api/competitors", async (request, reply) => {
  const payload = CreateCompetitorSchema.parse(request.body ?? {});
  const competitor = await createCompetitor(payload);
  reply.code(201);
  return { competitor };
});

app.post("/api/runs", async (request, reply) => {
  const payload = MarketRequestSchema.parse(request.body ?? {});
  const run = await createRun({
    market: payload.market,
    company: payload.company,
    region: payload.region,
    objective: payload.objective,
    horizon: payload.horizon,
    competitors: payload.competitors,
  });
  reply.code(201);
  return run;
});

app.get("/api/runs", async () => {
  const runs = await listRuns(20);
  return { runs };
});

app.get<{ Params: { id: string } }>("/api/runs/:id", async (request, reply) => {
  const run = await getRun(request.params.id);
  if (!run) {
    reply.code(404);
    return { error: "Run not found" };
  }
  return run;
});

// PDF Export endpoint
app.get<{ Params: { id: string } }>("/api/runs/:id/pdf", async (request, reply) => {
  const run = await getRun(request.params.id);
  if (!run) {
    reply.code(404);
    return { error: "Run not found" };
  }

  if (run.status !== "completed") {
    reply.code(400);
    return { error: "Run must be completed before exporting PDF" };
  }

  try {
    const pdf = await generateBoardMemoPDF({
      id: run.id,
      createdAt: run.startedAt,
      mode: run.mode || "demo",
      market: run.market,
      company: run.company,
      executiveSummary: run.executiveSummary || "",
      insights: run.insights || [],
      plays: run.plays || [],
    });

    const filename = generateMemoFilename(run.company, run.startedAt);

    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    return reply.send(pdf);
  } catch (error) {
    console.error("PDF generation failed:", error);
    reply.code(500);
    return { error: "Failed to generate PDF" };
  }
});

app.get<{ Params: { id: string } }>("/api/runs/:id/stream", async (request, reply) => {
  const run = await getRun(request.params.id);
  if (!run) {
    reply.code(404);
    return reply.send({ error: "Run not found" });
  }

  const requestOrigin = request.headers.origin;
  const corsOrigin = requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : "http://127.0.0.1:5173";

  reply.hijack();
  reply.raw.writeHead(200, {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = (eventName: string, payload: unknown) => {
    if (reply.raw.destroyed) return;
    reply.raw.write(`event: ${eventName}\n`);
    reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const controller = new AbortController();
  request.raw.on("close", () => controller.abort());

  await updateRun(run.id, { status: "streaming" });

  try {
    const result = await streamStrategyRun(
      MarketRequestSchema.parse({
        market: run.market,
        company: run.company,
        region: run.region,
        objective: run.objective,
        horizon: run.horizon,
        competitors: run.competitors,
      }),
      {
        emit: ({ type, data }) => send(type, data),
        signal: controller.signal,
      },
    );

    await updateRun(run.id, {
      status: "completed",
      mode: result.mode,
      executiveSummary: result.executiveSummary,
      insights: result.insights,
      plays: result.plays,
      completedAt: new Date(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown streaming error";
    send("error", { message });
    await updateRun(run.id, {
      status: "failed",
      error: message,
      completedAt: new Date(),
    });
  } finally {
    if (!reply.raw.destroyed) {
      reply.raw.end();
    }
  }
});

// ==================== Alerts API ====================

app.get("/api/alerts", async () => {
  const alerts = await listAlerts(50);
  return { alerts };
});

app.post<{ Params: { id: string } }>("/api/alerts/:id/read", async (request) => {
  await markAlertRead(request.params.id);
  return { ok: true };
});

app.post("/api/alerts/read-all", async () => {
  await markAllAlertsRead();
  return { ok: true };
});

app.get("/api/alert-rules", async () => {
  const rules = await listAlertRules();
  return { rules };
});

app.post("/api/alert-rules", async (request, reply) => {
  const { name, competitor, metric, operator, threshold, severity } = request.body as {
    name: string;
    competitor: string;
    metric: string;
    operator: string;
    threshold: number;
    severity: string;
  };
  const rule = await createAlertRule({ name, competitor, metric, operator, threshold, severity });
  reply.code(201);
  return rule;
});

app.patch<{ Params: { id: string } }>("/api/alert-rules/:id", async (request) => {
  const { isEnabled } = request.body as { isEnabled: boolean };
  await toggleAlertRule(request.params.id, isEnabled);
  return { ok: true };
});

app.delete<{ Params: { id: string } }>("/api/alert-rules/:id", async (request) => {
  await deleteAlertRule(request.params.id);
  return { ok: true };
});

app.post("/api/alerts/check", async () => {
  const newAlerts = await checkAlertRules();
  return { alerts: newAlerts, count: newAlerts.length };
});

// Automatically evaluate alert rules on a fixed interval so monitoring works
// without the user clicking "Check Now". Deduplication in checkAlertRules
// prevents the same alert from firing every cycle.
const ALERT_CHECK_INTERVAL_MS = Number(process.env.ALERT_CHECK_INTERVAL_MS || 5 * 60 * 1000);

function startAlertScheduler() {
  const runCheck = async () => {
    try {
      const created = await checkAlertRules();
      if (created.length) {
        app.log.info({ count: created.length }, "Auto alert check created new alerts");
      }
    } catch (error) {
      app.log.error({ err: error }, "Auto alert check failed");
    }
  };
  // Run shortly after boot, then on the interval.
  setTimeout(runCheck, 5000).unref();
  setInterval(runCheck, ALERT_CHECK_INTERVAL_MS).unref();
}

app
  .listen({ port, host: "127.0.0.1" })
  .then(() => startAlertScheduler())
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
