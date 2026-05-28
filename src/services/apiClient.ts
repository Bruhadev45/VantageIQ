import type {
  AgentRunResult,
  MarketDatasetResponse,
  MarketRequest,
  RunDetail,
  RunSummary,
} from "../shared/contracts";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787";

async function jsonOrThrow<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${context} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getApiHealth(): Promise<{ ok: boolean; service: string; openaiConfigured: boolean }> {
  return jsonOrThrow(await fetch(`${API_BASE_URL}/api/health`), "Health check");
}

export async function getMarketDataset(): Promise<MarketDatasetResponse> {
  return jsonOrThrow(await fetch(`${API_BASE_URL}/api/intelligence/dataset`), "Dataset request");
}

export async function runAgents(request: MarketRequest): Promise<AgentRunResult> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/intelligence/agents/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    }),
    "Agent run",
  );
}

export async function createRun(request: MarketRequest): Promise<RunDetail> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/runs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    }),
    "Run creation",
  );
}

export async function listRuns(): Promise<RunSummary[]> {
  const { runs } = await jsonOrThrow<{ runs: RunSummary[] }>(
    await fetch(`${API_BASE_URL}/api/runs`),
    "Runs list",
  );
  return runs;
}

export async function getRunById(id: string): Promise<RunDetail> {
  return jsonOrThrow(await fetch(`${API_BASE_URL}/api/runs/${id}`), "Run detail");
}

export function streamRunUrl(id: string): string {
  return `${API_BASE_URL}/api/runs/${id}/stream`;
}
