import "./env";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { MarketRequestSchema } from "../src/shared/contracts";
import { generateMarketBrief } from "../src/services/intelligenceEngine";
import { getMarketDataset } from "./db/repository";
import { runOpenAIStrategyAgents } from "./openaiClient";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8787);

await app.register(cors, {
  origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
});

app.get("/api/health", async () => ({
  ok: true,
  service: "vantageiq-api",
  openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
}));

app.post("/api/intelligence/brief", async (request) => {
  const payload = MarketRequestSchema.parse(request.body ?? {});
  return {
    brief: generateMarketBrief(payload.market),
  };
});

app.post("/api/intelligence/agents/run", async (request) => {
  const payload = MarketRequestSchema.parse(request.body ?? {});
  return runOpenAIStrategyAgents(payload);
});

app.get("/api/intelligence/dataset", async () => {
  const dataset = await getMarketDataset();
  return {
    sources: dataset.sources.map((source) => ({
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      date: source.date,
      notes: source.notes,
    })),
  };
});

app.listen({ port, host: "127.0.0.1" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
