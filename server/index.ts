import "./env";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { MarketRequestSchema, SourceIngestionSchema } from "../src/shared/contracts";
import { generateMarketBrief } from "../src/services/intelligenceEngine";
import { createRun, getMarketDataset, getRun, listRuns, updateRun } from "./db/repository";
import { runOpenAIStrategyAgents, streamStrategyRun } from "./openaiClient";
import { runLiveResearch } from "./researchProviders";
import { ingestSource } from "./sourceIngestor";

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
      {
        market: run.market,
        company: run.company,
        region: run.region,
        objective: run.objective,
        horizon: run.horizon,
        competitors: run.competitors,
      },
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

app.listen({ port, host: "127.0.0.1" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
