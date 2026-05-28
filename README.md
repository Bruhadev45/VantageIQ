# VantageIQ

VantageIQ is an AI business analyst platform for competitor research, market trend analysis, campaign intelligence, and growth strategy recommendations.

## Hackathon Positioning

The product helps companies answer four executive questions:

1. Which competitors are growing fastest?
2. What business strategies and campaigns are working for them?
3. Why are customers engaging with those companies?
4. What should our sales, marketing, and growth teams do next?

## Tech Stack

- React 18 + TypeScript for a fast, maintainable product frontend
- Vite for high-speed local development and optimized production builds
- Fastify for the backend API layer
- PostgreSQL with Prisma ORM for source-backed market intelligence
- Zod for request validation and shared typed contracts
- OpenAI Responses API for live executive strategy synthesis
- Agent modules for competitor research, trend analysis, campaign pattern detection, and growth strategy
- Recharts for dashboards and trend visualization
- Lucide React for a professional icon system

## MVP Scope

- Executive market command center
- Competitor growth monitor
- Trend radar with demand-signal charts
- Campaign intelligence lab
- AI strategy room with impact and confidence scoring
- Executive narrative for demo and pitch use

## Next Integrations

- OpenAI Responses API for live strategy generation
- Search/news/social ingestion for live competitor evidence
- CRM enrichment for account-specific recommendations
- Export to PDF or Google Slides for leadership briefs

## Local Development

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Create `.env.local` from `.env.example` to enable live OpenAI synthesis:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5
PORT=8787
```
