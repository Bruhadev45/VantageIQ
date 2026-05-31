import crypto from "node:crypto";
import type {
  LiveResearchResult,
  MarketRequest,
  SourceIngestionResult,
} from "../src/shared/contracts";
import { prisma } from "./db/client";

type CandidateSource = {
  title: string;
  url: string;
  publisher: string;
  date: string;
  text: string;
};

function publisherFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown publisher";
  }
}

function sourceId(url: string) {
  return `source-${crypto.createHash("sha1").update(url).digest("hex").slice(0, 16)}`;
}

function buildQuery(request: MarketRequest) {
  const competitors = request.competitors.length ? request.competitors.join(" OR ") : request.company;
  return `${request.market} ${request.region} (${competitors}) market share revenue growth campaign strategy customer engagement`;
}

function extractSignals(candidate: CandidateSource, request: MarketRequest) {
  const text = `${candidate.title}. ${candidate.text}`;
  const signals = [
    `${candidate.publisher} source discovered for ${request.market}.`,
    text.includes("%") || /\b(revenue|GOV|GMV|sales|market share)\b/i.test(text)
      ? "Contains commercial performance or market-share language."
      : "Useful for qualitative competitor context.",
    /\b(campaign|offer|discount|loyalty|membership|launch)\b/i.test(text)
      ? "Contains campaign, loyalty, offer, or launch signal."
      : "May support market trend or positioning analysis.",
  ];
  return signals;
}

async function saveCandidate(candidate: CandidateSource, request: MarketRequest): Promise<SourceIngestionResult> {
  const extractedSignals = extractSignals(candidate, request);
  const source = await prisma.marketSource.upsert({
    where: { url: candidate.url },
    update: {
      title: candidate.title,
      publisher: candidate.publisher,
      date: candidate.date,
      notes: extractedSignals.join(" "),
    },
    create: {
      id: sourceId(candidate.url),
      title: candidate.title,
      publisher: candidate.publisher,
      url: candidate.url,
      date: candidate.date,
      notes: extractedSignals.join(" "),
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

async function searchExa(query: string): Promise<CandidateSource[]> {
  if (!process.env.EXA_API_KEY) return [];

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.EXA_API_KEY,
    },
    body: JSON.stringify({
      query,
      numResults: 5,
      contents: {
        highlights: true,
        text: true,
      },
    }),
  });

  if (!response.ok) throw new Error(`Exa search failed with status ${response.status}`);
  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      publishedDate?: string;
      text?: string;
      highlights?: string[];
    }>;
  };

  return (data.results ?? [])
    .filter((result): result is Required<Pick<typeof result, "url">> & typeof result => Boolean(result.url))
    .map((result) => ({
      title: result.title || publisherFromUrl(result.url),
      url: result.url,
      publisher: publisherFromUrl(result.url),
      date: result.publishedDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      text: result.text || result.highlights?.join(" ") || "",
    }));
}

async function searchSerpApi(query: string): Promise<CandidateSource[]> {
  if (!process.env.SERPAPI_API_KEY) return [];

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("location", "India");
  url.searchParams.set("gl", "in");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SerpApi search failed with status ${response.status}`);
  const data = (await response.json()) as {
    organic_results?: Array<{
      title?: string;
      link?: string;
      source?: string;
      snippet?: string;
      date?: string;
    }>;
  };

  return (data.organic_results ?? [])
    .filter((result): result is Required<Pick<typeof result, "link">> & typeof result => Boolean(result.link))
    .slice(0, 5)
    .map((result) => ({
      title: result.title || publisherFromUrl(result.link),
      url: result.link,
      publisher: result.source || publisherFromUrl(result.link),
      date: result.date || new Date().toISOString().slice(0, 10),
      text: result.snippet || "",
    }));
}

export async function runLiveResearch(request: MarketRequest): Promise<LiveResearchResult> {
  if (!process.env.EXA_API_KEY && !process.env.SERPAPI_API_KEY) {
    const error = new Error(
      "No research providers configured. Set EXA_API_KEY or SERPAPI_API_KEY to enable live market scans.",
    ) as Error & { statusCode: number };
    error.statusCode = 503;
    throw error;
  }

  const query = buildQuery(request);
  const providers: string[] = [];
  const settled = await Promise.allSettled([searchExa(query), searchSerpApi(query)]);
  const candidates: CandidateSource[] = [];

  if (settled[0].status === "fulfilled" && settled[0].value.length) {
    providers.push("Exa");
    candidates.push(...settled[0].value);
  }
  if (settled[1].status === "fulfilled" && settled[1].value.length) {
    providers.push("SerpApi");
    candidates.push(...settled[1].value);
  }

  const unique = Array.from(new Map(candidates.map((candidate) => [candidate.url, candidate])).values()).slice(0, 8);
  const sources = await Promise.all(unique.map((candidate) => saveCandidate(candidate, request)));

  return {
    query,
    providers,
    sources,
  };
}
