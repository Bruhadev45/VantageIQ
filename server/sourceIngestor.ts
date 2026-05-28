import OpenAI from "openai";
import type { SourceIngestionRequest, SourceIngestionResult } from "../src/shared/contracts";
import { prisma } from "./db/client";

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string, url: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, " ").trim();
  return title || new URL(url).hostname.replace(/^www\./, "");
}

function publisherFromUrl(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

async function scrapeWithFirecrawl(url: string): Promise<{ title: string; text: string } | null> {
  if (!process.env.FIRECRAWL_API_KEY) return null;

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    data?: {
      markdown?: string;
      html?: string;
      metadata?: {
        title?: string;
      };
    };
  };
  const text = data.data?.markdown || stripHtml(data.data?.html || "");
  if (!text) return null;
  return {
    title: data.data?.metadata?.title || publisherFromUrl(url),
    text,
  };
}

function fallbackSignals(text: string, request: SourceIngestionRequest) {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  if (lower.includes("growth") || lower.includes("grew")) signals.push("Growth signal detected in source language.");
  if (lower.includes("revenue") || lower.includes("gov") || lower.includes("gmv")) {
    signals.push("Revenue, GOV, or GMV signal detected.");
  }
  if (lower.includes("campaign") || lower.includes("offer") || lower.includes("discount")) {
    signals.push("Campaign, offer, or discount signal detected.");
  }
  if (lower.includes("customer") || lower.includes("users") || lower.includes("mtu")) {
    signals.push("Customer engagement or active-user signal detected.");
  }
  if (!signals.length) {
    signals.push(`Potential market evidence for ${request.market}.`);
  }
  return signals.slice(0, 4);
}

async function extractWithOpenAI(text: string, request: SourceIngestionRequest): Promise<string[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content:
          "Extract concise market-intelligence signals from a business source. Return 3-5 short bullets. Focus on competitor strategy, campaign pattern, customer engagement, market trend, pricing, revenue, or growth.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            market: request.market,
            competitor: request.competitor,
            sourceText: text.slice(0, 8000),
          },
          null,
          2,
        ),
      },
    ],
  });

  const raw = response.output_text.trim();
  if (!raw) return null;
  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function ingestSource(request: SourceIngestionRequest): Promise<SourceIngestionResult> {
  const firecrawl = await scrapeWithFirecrawl(request.url);
  let title = firecrawl?.title;
  let text = firecrawl?.text;

  if (!text) {
    const response = await fetch(request.url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 VantageIQ/0.1 market-intelligence-bot; contact=local-demo",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
      },
    });

    if (!response.ok) {
      throw new Error(`Source fetch failed with status ${response.status}`);
    }

    const html = await response.text();
    title = extractTitle(html, request.url);
    text = stripHtml(html);
  }

  const publisher = publisherFromUrl(request.url);
  const extractedSignals = (await extractWithOpenAI(text, request)) ?? fallbackSignals(text, request);
  const notes = extractedSignals.join(" ");

  const source = await prisma.marketSource.upsert({
    where: { url: request.url },
    update: {
      title,
      publisher,
      url: request.url,
      date: new Date().toISOString().slice(0, 10),
      notes,
    },
    create: {
      id: `source-${Date.now().toString(36)}`,
      title: title || publisher,
      publisher,
      url: request.url,
      date: new Date().toISOString().slice(0, 10),
      notes,
    },
  });

  return {
    source: {
      id: source.id,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      date: source.date,
      notes: source.notes,
    },
    extractedSignals,
  };
}
