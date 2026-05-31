import type {
  AgentRunResult,
  Alert,
  AlertRule,
  CreateAlertRuleRequest,
  CreateCompetitorRequest,
  MarketCompetitor,
  MarketDatasetResponse,
  MarketRequest,
  LiveResearchResult,
  RunDetail,
  RunSummary,
  ScenarioSimulatorRequest,
  ScenarioSimulatorResult,
  SourceIngestionRequest,
  SourceIngestionResult,
} from "../shared/contracts";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787";

const TOKEN_KEY = "vaniq_token";
let authToken: string | null = typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return authToken;
}

// JSON headers with the bearer token attached when signed in (used for mutations).
function authJsonHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
  };
}

async function jsonOrThrow<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    let message = `${context} failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

// ==================== Auth API ====================

export type AuthUser = { id: string; email: string; name: string | null };

export async function signup(email: string, password: string, name?: string): Promise<{ token: string; user: AuthUser }> {
  const result = await jsonOrThrow<{ token: string; user: AuthUser }>(
    await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({ email, password, name }),
    }),
    "Sign up",
  );
  setAuthToken(result.token);
  return result;
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const result = await jsonOrThrow<{ token: string; user: AuthUser }>(
    await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({ email, password }),
    }),
    "Log in",
  );
  setAuthToken(result.token);
  return result;
}

export async function fetchMe(): Promise<AuthUser | null> {
  if (!authToken) return null;
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { authorization: `Bearer ${authToken}` },
  });
  if (!response.ok) return null;
  const { user } = (await response.json()) as { user: AuthUser };
  return user;
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
      headers: authJsonHeaders(),
      body: JSON.stringify(request),
    }),
    "Agent run",
  );
}

export async function createRun(request: MarketRequest): Promise<RunDetail> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/runs`, {
      method: "POST",
      headers: authJsonHeaders(),
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

export async function ingestSource(request: SourceIngestionRequest): Promise<SourceIngestionResult> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/intelligence/sources/ingest`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify(request),
    }),
    "Source ingestion",
  );
}

export async function runLiveResearch(request: MarketRequest): Promise<LiveResearchResult> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/intelligence/research/live`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify(request),
    }),
    "Live research",
  );
}

export async function simulateScenario(request: ScenarioSimulatorRequest): Promise<ScenarioSimulatorResult> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/intelligence/scenario`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify(request),
    }),
    "Scenario simulation",
  );
}

export async function createCompetitor(request: CreateCompetitorRequest): Promise<MarketCompetitor> {
  const { competitor } = await jsonOrThrow<{ competitor: MarketCompetitor }>(
    await fetch(`${API_BASE_URL}/api/competitors`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify(request),
    }),
    "Create competitor",
  );
  return competitor;
}

export function runPdfUrl(id: string): string {
  return `${API_BASE_URL}/api/runs/${id}/pdf`;
}

export function streamRunUrl(id: string): string {
  return `${API_BASE_URL}/api/runs/${id}/stream`;
}

// ==================== Alerts API ====================

export async function listAlerts(): Promise<Alert[]> {
  const { alerts } = await jsonOrThrow<{ alerts: Alert[] }>(
    await fetch(`${API_BASE_URL}/api/alerts`),
    "Alerts list",
  );
  return alerts;
}

export async function markAlertAsRead(id: string): Promise<void> {
  await jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/alerts/${id}/read`, { method: "POST", headers: authJsonHeaders() }),
    "Mark alert read",
  );
}

export async function markAllAlertsAsRead(): Promise<void> {
  await jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/alerts/read-all`, { method: "POST", headers: authJsonHeaders() }),
    "Mark all alerts read",
  );
}

export async function listAlertRules(): Promise<AlertRule[]> {
  const { rules } = await jsonOrThrow<{ rules: AlertRule[] }>(
    await fetch(`${API_BASE_URL}/api/alert-rules`),
    "Alert rules list",
  );
  return rules;
}

export async function createAlertRule(rule: CreateAlertRuleRequest): Promise<AlertRule> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/alert-rules`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify(rule),
    }),
    "Create alert rule",
  );
}

export async function toggleAlertRule(id: string, isEnabled: boolean): Promise<void> {
  await jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/alert-rules/${id}`, {
      method: "PATCH",
      headers: authJsonHeaders(),
      body: JSON.stringify({ isEnabled }),
    }),
    "Toggle alert rule",
  );
}

export async function deleteAlertRule(id: string): Promise<void> {
  await jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/alert-rules/${id}`, { method: "DELETE", headers: authJsonHeaders() }),
    "Delete alert rule",
  );
}

export async function checkAlertRules(): Promise<{ alerts: Alert[]; count: number }> {
  return jsonOrThrow(
    await fetch(`${API_BASE_URL}/api/alerts/check`, { method: "POST", headers: authJsonHeaders() }),
    "Check alert rules",
  );
}
