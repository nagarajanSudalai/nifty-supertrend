import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const POLL_INTERVAL_MS = 60_000;

export interface SupertrendState {
  direction: "BULLISH" | "BEARISH";
  band: number;
  close: number;
  timestamp: string;
}

export interface SignalEvent {
  direction: "BULLISH" | "BEARISH";
  band: number;
  close: number;
  timestamp: string;
}

export interface StatusResponse {
  state: SupertrendState | null;
  history: SignalEvent[];
  deviceCount: number;
}

export function useSupertrendStatus() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!BACKEND_URL) {
      setError("EXPO_PUBLIC_BACKEND_URL is not set");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StatusResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") fetchStatus();
      }
    );
    return () => subscription.remove();
  }, [fetchStatus]);

  return { data, loading, error, refresh: fetchStatus };
}
