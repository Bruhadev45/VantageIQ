import * as cheerio from "cheerio";
import OpenAI from "openai";
import type { MarketSourceSummary, SourceIngestionRequest, SourceIngestionResult } from "../src/shared/contracts";
import { prisma } from "./db/client";

// Better HTML parsing with Cheerio
function parseHtmlContent(html: string): { title: string; text: string; meta: Record<string, string> } {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("script, style, nav, footer, header, aside, iframe, noscript, .ad, .advertisement, .sidebar").remove();

  // Extract title
  const title = $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    "Untitled";

  // Extract meta information
  const meta: Record<string, string> = {};
  meta.description = $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") || "";
  meta.author = $('meta[name="author"]').attr("content") || "";
  meta.publishedTime = $('meta[property="article:published_time"]').attr("content") ||
    $("time").attr("datetime") || "";

  // Extract main content - try multiple selectors
  const contentSelectors = [
    "article",
    "main",
    '[role="main"]',
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    "#content",
    "body",
  ];

  let text = "";
  for (const selector of contentSelectors) {
    const content = $(selector).first();
    if (content.length) {
      // Get text from paragraphs, headings, and list items
      const elements = content.find("p, h1, h2, h3, h4, h5, h6, li");
      if (elements.length) {
        text = elements.map((_, el) => $(el).text().trim()).get().join("\n\n");
        if (text.length > 200) break;
      }
    }
  }

  // Fallback to body text
  if (!text || text.length < 100) {
    text = $("body").text().replace(/\s+/g, " ").trim();
  }

  return { title, text: text.slice(0, 15000), meta };
}

function publisherFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    // Clean up common patterns
    return hostname
      .replace(/\.com$|\.org$|\.net$|\.in$|\.co\.in$/, "")
      .split(".")
      .pop() || hostname;
  } catch {
    return "unknown";
  }
}

function sourceReliability(source: { publisher: string; url: string; date: string; notes: string }) {
  const publisher = source.publisher.toLowerCase();
  const host = safeHostname(source.url);
  const institutional = publisher.includes("usda") || host.endsWith(".gov") || host.endsWith(".edu");
  const primaryCompany = host.includes("swiggy.com") || host.includes("zomato.com") || host.includes("blinkit.com");
  const businessMedia =
    publisher.includes("financial") || publisher.includes("economic") || publisher.includes("business");
  const recencyDays = daysSince(source.date);
  const recencyScore = recencyDays === null ? 12 : recencyDays <= 90 ? 25 : recencyDays <= 365 ? 18 : 10;
  const publisherScore = institutional || primaryCompany ? 35 : businessMedia ? 28 : 18;
  const signalCount = source.notes.split("|").map((signal) => signal.trim()).filter(Boolean).length;
  const evidenceStrength = Math.min(30, 10 + signalCount * 4 + (/\d/.test(source.notes) ? 6 : 0));
  const reliabilityScore = Math.max(1, Math.min(100, publisherScore + recencyScore + evidenceStrength));
  const reliabilityLabel: MarketSourceSummary["reliabilityLabel"] =
    reliabilityScore >= 78 ? "High" : reliabilityScore >= 55 ? "Medium" : "Low";

  return { reliabilityScore, reliabilityLabel, recencyDays, evidenceStrength };
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function daysSince(value: string): number | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return days < 0 ? 0 : days;
}

// Enhanced signal extraction with pattern matching
function extractSignalsFromText(text: string, request: SourceIngestionRequest): string[] {
  const signals: string[] = [];
  const lower = text.toLowerCase();

  // Growth patterns
  const growthMatch = text.match(/(\d+(?:\.\d+)?)\s*%?\s*(growth|grew|increase|up)/gi);
  if (growthMatch) {
    signals.push(`Growth indicator: ${growthMatch[0]}`);
  }

  // Revenue/GMV patterns
  const revenueMatch = text.match(/(?:revenue|gmv|sales)\s*(?:of|at|reached)?\s*(?:rs\.?|inr|₹|\$)?\s*([\d,]+(?:\.\d+)?)\s*(cr(?:ore)?|mn|million|bn|billion)?/gi);
  if (revenueMatch) {
    signals.push(`Revenue signal: ${revenueMatch[0]}`);
  }

  // Funding patterns
  const fundingMatch = text.match(/(?:raised|funding|investment)\s*(?:of|at)?\s*(?:\$|₹|rs\.?)?\s*([\d,]+(?:\.\d+)?)\s*(mn|million|bn|billion|cr(?:ore)?)/gi);
  if (fundingMatch) {
    signals.push(`Funding news: ${fundingMatch[0]}`);
  }

  // Expansion patterns
  const expansionMatch = text.match(/(?:expand|launch|enter)(?:ed|ing)?\s+(?:to|in|into)\s+([\w\s,]+(?:cities|markets|regions))/gi);
  if (expansionMatch) {
    signals.push(`Expansion signal: ${expansionMatch[0]}`);
  }

  // Partnership patterns
  const partnerMatch = text.match(/(?:partner(?:ship|ed)?|collaborat(?:e|ion)|tie[- ]up)\s+(?:with)?\s+([\w\s]+)/gi);
  if (partnerMatch) {
    signals.push(`Partnership: ${partnerMatch[0].slice(0, 80)}`);
  }

  // Campaign/offer patterns
  if (lower.includes("campaign") || lower.includes("discount") || lower.includes("offer") || lower.includes("promotion")) {
    signals.push("Marketing campaign or promotional activity detected");
  }

  // User/customer patterns
  const userMatch = text.match(/([\d,]+(?:\.\d+)?)\s*(mn|million|k|thousand|lakh|cr(?:ore)?)?\s*(?:users|customers|mau|mtu|orders)/gi);
  if (userMatch) {
    signals.push(`User metric: ${userMatch[0]}`);
  }

  // Competitor mentions
  const competitors = ["blinkit", "zepto", "swiggy", "instamart", "bigbasket", "dunzo", "amazon", "flipkart"];
  const mentionedCompetitors = competitors.filter(c => lower.includes(c));
  if (mentionedCompetitors.length) {
    signals.push(`Competitor mentions: ${mentionedCompetitors.join(", ")}`);
  }

  // Market-specific signals for quick commerce
  if (request.market.toLowerCase().includes("quick") || request.market.toLowerCase().includes("commerce")) {
    if (lower.includes("delivery time") || lower.includes("minutes")) {
      signals.push("Quick commerce delivery time mentioned");
    }
    if (lower.includes("dark store") || lower.includes("micro-warehouse")) {
      signals.push("Dark store / micro-fulfillment infrastructure signal");
    }
  }

  // Ensure at least one signal
  if (!signals.length) {
    signals.push(`Market intelligence source for ${request.market}`);
  }

  return signals.slice(0, 6);
}

async function scrapeWithFirecrawl(url: string): Promise<{ title: string; text: string } | null> {
  if (!process.env.FIRECRAWL_API_KEY) return null;

  try {
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
        metadata?: { title?: string };
      };
    };

    const text = data.data?.markdown || (data.data?.html ? parseHtmlContent(data.data.html).text : "");
    if (!text) return null;

    return {
      title: data.data?.metadata?.title || publisherFromUrl(url),
      text,
    };
  } catch {
    return null;
  }
}

async function extractWithOpenAI(text: string, request: SourceIngestionRequest): Promise<string[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      input: [
        {
          role: "system",
          content: `You are a competitive intelligence analyst specializing in ${request.market}.
Extract the most important market signals from this source. Focus on:
- Competitor strategy moves
- Financial metrics (revenue, growth, funding)
- Campaign patterns and marketing activities
- Customer engagement metrics
- Market expansion signals
- Strategic partnerships

Return 4-6 concise bullet points. Each should be a specific, actionable insight.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            market: request.market,
            competitor: request.competitor,
            sourceText: text.slice(0, 10000),
          }, null, 2),
        },
      ],
    });

    const raw = response.output_text?.trim();
    if (!raw) return null;

    return raw
      .split(/\n+/)
      .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 6);
  } catch (error) {
    console.error("OpenAI extraction failed:", error);
    return null;
  }
}

// A client-input error that the API error handler renders as HTTP 400.
function badRequest(message: string): Error {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = 400;
  return error;
}

// Reject URLs that target the local network to avoid SSRF against internal services.
function assertPublicUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw badRequest("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw badRequest("Only http(s) URLs can be ingested");
  }
  const host = parsed.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);
  if (blocked) {
    throw badRequest("Refusing to fetch a private or local network address");
  }
}

export async function ingestSource(request: SourceIngestionRequest): Promise<SourceIngestionResult> {
  assertPublicUrl(request.url);

  // Try Firecrawl first
  let firecrawl = await scrapeWithFirecrawl(request.url);
  let title = firecrawl?.title;
  let text = firecrawl?.text;
  let meta: Record<string, string> = {};

  // Fallback to direct fetch + Cheerio parsing
  if (!text) {
    try {
      const response = await fetch(request.url, {
        headers: {
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const html = await response.text();
      const parsed = parseHtmlContent(html);
      title = parsed.title;
      text = parsed.text;
      meta = parsed.meta;
    } catch (error) {
      throw badRequest(`Source fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  const publisher = publisherFromUrl(request.url);

  // Extract signals - try OpenAI first, fallback to pattern matching
  const extractedSignals = (await extractWithOpenAI(text, request)) ?? extractSignalsFromText(text, request);
  const notes = extractedSignals.join(" | ");

  // Determine date
  const date = meta.publishedTime
    ? new Date(meta.publishedTime).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // Upsert to database
  const source = await prisma.marketSource.upsert({
    where: { url: request.url },
    update: {
      title,
      publisher,
      date,
      notes,
    },
    create: {
      id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: title || publisher,
      publisher,
      url: request.url,
      date,
      notes,
    },
  });

  const reliability = sourceReliability(source);

  return {
    source: {
      id: source.id,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      date: source.date,
      notes: source.notes,
      ...reliability,
    },
    extractedSignals,
  };
}

// Batch ingestion for multiple URLs
export async function ingestMultipleSources(
  urls: string[],
  request: Omit<SourceIngestionRequest, "url">,
): Promise<SourceIngestionResult[]> {
  const results: SourceIngestionResult[] = [];

  for (const url of urls.slice(0, 10)) {
    try {
      const result = await ingestSource({ ...request, url });
      results.push(result);
    } catch (error) {
      console.error(`Failed to ingest ${url}:`, error);
    }
  }

  return results;
}
