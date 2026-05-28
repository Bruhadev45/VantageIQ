# VantageIQ

VantageIQ is an AI business analyst platform for competitor research, market trend analysis, campaign intelligence, and growth strategy recommendations — focused on India's quick-commerce race (Blinkit, Zepto, Swiggy Instamart, BigBasket).

## What's wired

- **Live OpenAI agent runs over SSE.** `POST /api/runs` creates a `Run` row in Postgres, then `GET /api/runs/:id/stream` streams `agent.start` → `agent.token` → `agent.complete` → `run.complete` events as the Research, Trend, Campaign, and Strategy agents call `client.responses.stream(...)`.
- **Run history.** Every run is persisted with status, market, company, insights, plays, executive summary, mode (`live-openai` vs `demo`), and timestamps. The topbar clock icon opens a popover of the last 20 runs.
- **Single-source-of-truth dataset.** `GET /api/intelligence/dataset` returns sources + competitors + trends + campaigns + recommendations from Postgres. The frontend no longer ships any hardcoded mock data.
- **Multi-view dashboard.** Sidebar nav switches between Command Center / Competitors / Trend Radar / Campaign Lab / AI Strategy Room — all driven from the same dataset hook, no router round-trips.
- **Working interactivity.** Search filters the competitor and campaign lists. "Add competitor" opens a real dialog that injects the name into the next run. "Generate board brief" triggers a streaming run. "Export" downloads the latest run JSON. Notifications surface a sonner toast.
- **Resilience.** `ErrorBoundary` around the whole tree; per-API-call error fallbacks; explicit "API offline" panel if the backend is unreachable; cancel-on-unmount for SSE.

## Stack

- React 18 + Vite SPA, sonner toasts, Recharts dashboards, Lucide icons
- Fastify 5 API, Zod request validation, CORS configured for cross-origin cookies
- Prisma 6 + PostgreSQL (TimescaleDB-ready)
- OpenAI Responses API (streaming)

## Local development

```bash
npm install
createdb vantageiq_local            # if not done already
npm run db:push
npm run db:seed
npm run dev                         # web on 5173, api on 8787
```

Configure `.env.local`:

```
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5
DATABASE_URL="postgresql://USER@localhost:5432/vantageiq_local?schema=public"
PORT=8787
```

If `OPENAI_API_KEY` is unset, the API falls back to `mode: "demo"` and uses the four baseline agents under [server/agents/](server/agents/) without any LLM call.

## Architecture today

```
React SPA (Vite) ─┐
                   ├─► Fastify API (Postgres + Prisma)
SSE EventSource ──┘     └─► OpenAI Responses streaming
                              ├─► Research / Trend / Campaign / Strategy agents
                              └─► Persisted Run rows
```

Key files:

- [server/index.ts](server/index.ts) — REST + SSE routes
- [server/openaiClient.ts](server/openaiClient.ts) — OpenAI Responses streaming + orchestration
- [server/agents/](server/agents/) — four baseline agents (used as both fallback and prompt context)
- [server/db/repository.ts](server/db/repository.ts) — typed dataset + run repository
- [src/features/](src/features/) — feature-folder components (shell, command-center, competitors, campaigns, trends, strategy, evidence)
- [src/hooks/](src/hooks/) — `useDataset`, `useRunStream` (EventSource), `useRunHistory`
- [src/shared/contracts.ts](src/shared/contracts.ts) — Zod + TS contracts shared by both sides

## Production MVP roadmap


Outstanding (in priority order):

1. **Tests** — Vitest + supertest + Playwright. Install blocked locally by ENOSPC (disk at 99%).
2. **Auth + multi-tenant** — better-auth, Workspace model, `workspaceId`-scoped queries.
3. **Live ingestion** — Exa / NewsAPI / Reddit adapters, BullMQ workers, `EvidenceItem` table.
4. **Alerts** — `AlertRule` model + Resend email digests.
5. **PDF export** — `@react-pdf/renderer` for board briefs.
6. **Deploy** — Vercel (frontend) + Railway (api + worker + Postgres + Redis).

## Verification

Backend smoke test (run with `npm run dev:api` listening on 8787):

```bash
curl -sS http://127.0.0.1:8787/api/health
# {"ok":true,"service":"vantageiq-api","openaiConfigured":true}

RUN=$(curl -sS -X POST http://127.0.0.1:8787/api/runs \
  -H 'content-type: application/json' \
  -d '{"market":"India quick commerce","company":"Test","competitors":["Blinkit","Zepto"]}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')

curl -sS -N "http://127.0.0.1:8787/api/runs/$RUN/stream" | head -c 2000
curl -sS "http://127.0.0.1:8787/api/runs/$RUN" | python3 -m json.tool
```

You should see SSE `event: agent.token` lines streaming live OpenAI deltas, then a final persisted `Run` row with `status: "completed"`, `mode: "live-openai"`, populated `insights[]` and `plays[]`.
