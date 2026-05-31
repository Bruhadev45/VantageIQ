import puppeteer from "puppeteer";
import type { AgentRunResult } from "../src/shared/contracts";

export async function generateBoardMemoPDF(
  run: AgentRunResult & { id: string; createdAt: string }
): Promise<Buffer> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const html = buildMemoHTML(run);
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "40px", right: "40px", bottom: "40px", left: "40px" },
    });

    return Buffer.from(pdf);
  } finally {
    // Always release the Chromium process, even if rendering throws.
    if (browser) await browser.close();
  }
}

function buildMemoHTML(run: AgentRunResult & { id: string; createdAt: string }): string {
  const date = new Date(run.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const insights = run.insights
    .map(
      (i) => `
      <div class="insight-card">
        <div class="insight-header">
          <span class="agent-badge">${i.agent}</span>
          <span class="confidence">${i.confidence}% confidence</span>
        </div>
        <p class="finding">${i.finding}</p>
        <ul class="evidence">
          ${i.evidence.map((e) => `<li>${e}</li>`).join("")}
        </ul>
      </div>
    `
    )
    .join("");

  const plays = run.plays
    .map(
      (p) => `
      <tr>
        <td><strong>${p.title}</strong></td>
        <td>${p.team}</td>
        <td><span class="priority ${p.priority.toLowerCase()}">${p.priority}</span></td>
        <td>${p.action}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VantageIQ Board Memo - ${run.company}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #fff;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #166534;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #166534;
      letter-spacing: 2px;
    }
    .meta {
      text-align: right;
      font-size: 12px;
      color: #6b6b7b;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #166534;
      margin: 24px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e5e5;
    }
    .summary-box {
      background: linear-gradient(135deg, #f0fdf4, #ecfeff);
      border: 1px solid #166534;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .summary-box p {
      font-size: 16px;
      line-height: 1.7;
    }
    .insight-card {
      background: #fafafa;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .agent-badge {
      background: #166534;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .confidence {
      font-size: 12px;
      color: #6b6b7b;
    }
    .finding {
      font-size: 14px;
      margin-bottom: 12px;
    }
    .evidence {
      font-size: 12px;
      color: #6b6b7b;
      padding-left: 20px;
    }
    .evidence li {
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e5e5e5;
      font-size: 13px;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .priority {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .priority.high {
      background: #fef2f2;
      color: #991b1b;
    }
    .priority.medium {
      background: #fffbeb;
      color: #92400e;
    }
    .priority.low {
      background: #f0fdf4;
      color: #166534;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 11px;
      color: #6b6b7b;
      text-align: center;
    }
    .mode-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      background: ${run.mode === "live-openai" ? "#166534" : "#6b6b7b"};
      color: white;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">VANTAGEIQ</div>
      <p style="font-size: 12px; color: #6b6b7b; margin-top: 4px;">Competitive Intelligence Report</p>
    </div>
    <div class="meta">
      <p><strong>${date}</strong></p>
      <p>Report ID: ${run.id}</p>
      <p>Mode: <span class="mode-badge">${run.mode === "live-openai" ? "AI-Powered" : "Demo"}</span></p>
    </div>
  </div>

  <h1>Board Memo: ${run.company}</h1>
  <p style="color: #6b6b7b; margin-bottom: 20px;">Market: ${run.market}</p>

  <h2>Executive Summary</h2>
  <div class="summary-box">
    <p>${run.executiveSummary}</p>
  </div>

  <h2>Agent Insights</h2>
  ${insights}

  <h2>Recommended Actions</h2>
  <table>
    <thead>
      <tr>
        <th>Initiative</th>
        <th>Team</th>
        <th>Priority</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${plays}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by VantageIQ | AI-Powered Competitive Intelligence</p>
    <p>This report is confidential and intended for internal use only.</p>
  </div>
</body>
</html>
  `;
}

export function generateMemoFilename(company: string, date: string): string {
  const sanitized = company.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const dateStr = new Date(date).toISOString().split("T")[0];
  return `VantageIQ-BoardMemo-${sanitized}-${dateStr}.pdf`;
}
