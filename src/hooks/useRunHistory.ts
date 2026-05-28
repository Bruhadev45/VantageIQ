import { useCallback, useEffect, useState } from "react";
import { listRuns } from "../services/apiClient";
import type { RunSummary } from "../shared/contracts";

export function useRunHistory(triggerRefresh: unknown) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await listRuns();
      setRuns(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, triggerRefresh]);

  return { runs, loading, error, refresh: load };
}
