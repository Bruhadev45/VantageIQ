# VantageIQ 🎯

**AI-Powered Competitive Intelligence Platform**

> Transform competitor signals into actionable growth strategies in minutes, not weeks.

![VantageIQ Dashboard](https://img.shields.io/badge/Status-Hackathon_MVP-lime?style=for-the-badge)
![Built with Codex](https://img.shields.io/badge/Built_with-Codex-412991?style=for-the-badge&logo=openai)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-Agents_SDK-412991?style=flat-square&logo=openai)

---

## 🚀 The Problem

Companies spend **20+ hours/week** manually tracking competitors across scattered sources. By the time insights reach decision-makers, they're outdated. Result: reactive strategies, missed opportunities, lost market share.

## 💡 Our Solution

VantageIQ uses **multi-agent AI orchestration** to:

1. **Monitor** competitors in real-time (Blinkit, Zepto, Swiggy Instamart)
2. **Analyze** market trends, campaign patterns, and growth signals
3. **Generate** board-ready strategic recommendations
4. **Stream** insights live as AI agents work in parallel

### User Journey

```
Define Mission → AI Agents Activate → Live Dashboard → Export Strategy
     ↓                   ↓                  ↓              ↓
  Market +         4 Specialized      Real-time      Board-ready
 Competitors         Agents           Streaming        Briefs
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent AI** | Research, Trend, Campaign, and Strategy agents work in parallel |
| **Live Streaming** | Watch AI reasoning in real-time via SSE, with a live run timer & progress |
| **Mission Builder** | Configure market, company, and competitors to track |
| **Board Memos** | Auto-generated executive summaries, exportable as PDF |
| **Counter Strategies** | AI-recommended responses to competitor moves |
| **Evidence Layer** | Source-backed market data with citations + one-click live web scan |
| **Authentication** | Email/password signup & login (bcrypt + JWT); mutations are token-guarded |
| **Guided Tour** | First-run spotlight tour that walks new users through the workflow |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Custom CSS (Greptile-inspired design) |
| **Charts** | Recharts |
| **Backend** | Node.js + Fastify 5 |
| **Database** | PostgreSQL + Prisma 6 |
| **AI Engine** | OpenAI Agents SDK (streaming) |
| **Icons** | Lucide React |

---

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- OpenAI API key

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/VantageIQ.git
cd VantageIQ

# Install dependencies
npm install

# Set up database
createdb vantageiq_local
npm run db:push
npm run db:seed

# Configure environment
cp .env.example .env.local
# Edit .env.local with your OPENAI_API_KEY

# Run development servers (web on :5173, API on :8787)
npm run dev
```

On first launch you'll be asked to **create an account** (email + password), then a short **guided tour** walks you through running the AI analyst team. Seeded market data is shared across accounts.

### Environment Variables

```env
# Required for live AI agents & chat (omit for demo mode)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Optional research providers (live market scans + richer ingestion)
SERPAPI_API_KEY=
FIRECRAWL_API_KEY=
EXA_API_KEY=

# PostgreSQL (TCP). Local-socket alt: ...?host=%2Ftmp&schema=public
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/vantageiq_local?schema=public"

# Secret for signing auth JWTs — set a long random string (e.g. `openssl rand -hex 32`)
AUTH_JWT_SECRET=change-me-to-a-long-random-string

PORT=8787
ALERT_CHECK_INTERVAL_MS=300000   # auto alert-rule evaluation cadence (ms)
VITE_API_BASE_URL=               # override API URL when web/API are on different hosts
```

> **Note:** If `OPENAI_API_KEY` is unset, the API runs in demo mode with pre-configured agent responses. The research providers (Exa, SerpAPI, Firecrawl) are optional — live market scans degrade gracefully when their keys are absent.

---

## 📁 Project Structure

```
VantageIQ/
├── src/
│   ├── features/           # Feature-based components
│   │   ├── shell/          # App shell, sidebar, topbar
│   │   ├── command-center/ # Hero, metrics, trends
│   │   ├── competitors/    # Competitor monitor, radar
│   │   ├── campaigns/      # Campaign lab, channel mix
│   │   ├── strategy/       # Recommendations, board memo
│   │   ├── mission/        # Mission builder form
│   │   └── evidence/       # Source citations
│   ├── hooks/              # useDataset, useRunStream
│   ├── shared/             # Zod contracts
│   └── styles.css          # Global styles
├── server/
│   ├── agents/             # AI agent definitions
│   ├── db/                 # Prisma repository
│   ├── index.ts            # Fastify API + SSE
│   └── openaiClient.ts     # OpenAI orchestration
└── prisma/
    └── schema.prisma       # Database schema
```

---

## 🎯 Target Audience

| Segment | Use Case |
|---------|----------|
| **Strategy Teams** | Weekly competitor briefings |
| **Product Managers** | Feature gap analysis |
| **Founders/Executives** | Board meeting prep |
| **Investors** | Due diligence research |

**Initial Focus:** India Quick Commerce Market ($6B+ GMV)

---

## 🔮 Roadmap

- [x] Multi-agent AI orchestration
- [x] Live SSE streaming
- [x] Mission builder
- [x] Board memo generation
- [x] Counter-strategy matrix
- [x] Live data ingestion (Exa, SerpAPI, Firecrawl) + global web search
- [x] PDF export (Puppeteer board memos)
- [x] Alert rules with automatic background evaluation
- [x] Competitor tracking persisted to the workspace
- [x] Scenario simulator + campaign A/B test planner + trend-driver drilldowns
- [x] AI chat assistant with conversation memory
- [x] Authentication (email/password + JWT, token-guarded mutations)
- [x] First-run guided product tour
- [ ] Multi-tenant workspaces & per-user data isolation
- [ ] Email alerts (Resend)
- [ ] Vercel + Railway deployment

---

## 🧪 API Verification

```bash
# Health check (open)
curl http://127.0.0.1:8787/api/health

# Sign up to get a token (mutations require it)
TOKEN=$(curl -s -X POST http://127.0.0.1:8787/api/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"hunter2pass"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# Create a run (needs the bearer token)
curl -X POST http://127.0.0.1:8787/api/runs \
  -H 'content-type: application/json' -H "authorization: Bearer $TOKEN" \
  -d '{"market":"India quick commerce","company":"Test","competitors":["Blinkit","Zepto"]}'

# Stream results — open, no token needed (replace $RUN_ID)
curl -N "http://127.0.0.1:8787/api/runs/$RUN_ID/stream"
```

---

## 👥 Team

Built for **Hackathon 2026**

**100% built with [OpenAI Codex](https://openai.com/codex)** — from architecture to implementation, all code was generated via AI-assisted development.

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

<p align="center">
  <strong>VantageIQ</strong> — Intelligence at the speed of competition
</p>
