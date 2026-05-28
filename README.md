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
| **Live Streaming** | Watch AI reasoning in real-time via SSE |
| **Mission Builder** | Configure market, company, and competitors to track |
| **Board Memos** | Auto-generated executive summaries |
| **Counter Strategies** | AI-recommended responses to competitor moves |
| **Evidence Layer** | Source-backed market data with citations |

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

# Run development servers
npm run dev
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
DATABASE_URL="postgresql://USER@localhost:5432/vantageiq_local?schema=public"
PORT=8787
```

> **Note:** If `OPENAI_API_KEY` is unset, the API runs in demo mode with pre-configured agent responses.

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
- [ ] Authentication (better-auth)
- [ ] Live data ingestion (Exa, NewsAPI)
- [ ] Email alerts (Resend)
- [ ] PDF export
- [ ] Vercel + Railway deployment

---

## 🧪 API Verification

```bash
# Health check
curl http://127.0.0.1:8787/api/health

# Create a run
curl -X POST http://127.0.0.1:8787/api/runs \
  -H 'content-type: application/json' \
  -d '{"market":"India quick commerce","company":"Test","competitors":["Blinkit","Zepto"]}'

# Stream results (replace $RUN_ID)
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
