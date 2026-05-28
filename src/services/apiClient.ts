import type { AgentRunResult, MarketDatasetResponse, MarketRequest } from "../shared/contracts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787";

export async function runAgents(request: MarketRequest): Promise<AgentRunResult> {
  const response = await fetch(`${API_BASE_URL}/api/intelligence/agents/run`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Agent run failed with status ${response.status}`);
  }

  return response.json() as Promise<AgentRunResult>;
}

export async function getApiHealth(): Promise<{ ok: boolean; openaiConfigured: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`API health check failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: boolean; openaiConfigured: boolean }>;
}

export async function getMarketDataset(): Promise<MarketDatasetResponse> {
  const response = await fetch(`${API_BASE_URL}/api/intelligence/dataset`);

  if (!response.ok) {
    throw new Error(`Dataset request failed with status ${response.status}`);
  }

  return response.json() as Promise<MarketDatasetResponse>;
}
