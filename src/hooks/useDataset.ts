import { useCallback, useEffect, useState } from "react";
import { getApiHealth, getMarketDataset } from "../services/apiClient";
import type { MarketDatasetResponse } from "../shared/contracts";

export type ApiStatus = "connecting" | "live" | "demo" | "offline";

export type DatasetState = {
  dataset: MarketDatasetResponse | null;
  status: ApiStatus;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDataset(): DatasetState {
  const [dataset, setDataset] = useState<MarketDatasetResponse | null>(null);
  const [status, setStatus] = useState<ApiStatus>("connecting");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, data] = await Promise.all([getApiHealth(), getMarketDataset()]);
      setDataset(data);
      setStatus(health.openaiConfigured ? "live" : "demo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dataset");
      setStatus("offline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { dataset, status, loading, error, refresh: load };
}
