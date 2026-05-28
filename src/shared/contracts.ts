import { z } from "zod";

export const MarketRequestSchema = z.object({
  market: z.string().min(2).max(120).default("India quick commerce"),
  company: z.string().min(2).max(120).default("Your company"),
  competitors: z.array(z.string().min(2).max(120)).max(8).default([]),
});

export type MarketRequest = z.infer<typeof MarketRequestSchema>;

export type AgentInsight = {
  agent: "Research" | "Trend" | "Campaign" | "Strategy";
  finding: string;
  confidence: number;
  evidence: string[];
};

export type AgentRunResult = {
  mode: "live-openai" | "demo";
  market: string;
  company: string;
  executiveSummary: string;
  insights: AgentInsight[];
  plays: {
    title: string;
    team: "Sales" | "Marketing" | "Growth" | "Customer Success";
    priority: "High" | "Medium" | "Low";
    action: string;
  }[];
};

export type MarketSourceSummary = {
  title: string;
  publisher: string;
  url: string;
  date: string;
  notes: string;
};

export type MarketDatasetResponse = {
  sources: MarketSourceSummary[];
};
