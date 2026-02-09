"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PortfolioResponse } from "../types/portfolio";

// 15s matches the Google Finance scraper's cache TTL (CACHE_TTL in googleFinance.ts).
// If you change one, update the other or we'll either poll stale data or hammer the API.
const POLL_INTERVAL = 15_000;

interface UsePortfolioResult {
  data: PortfolioResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: Date | null;
  refetch: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioResult {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Guards against the React "setState on unmounted component" warning —
  // the fetch can outlive the component during fast navigations.
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;

    try {
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const portfolio: PortfolioResponse = await res.json();

      if (mountedRef.current) {
        setData(portfolio);
        setError(
          portfolio.errors.length > 0 ? portfolio.errors.join("; ") : null
        );
        setLastFetchTime(new Date());
        setIsLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError((err as Error).message);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);

    // Prices go stale while the tab is backgrounded — we refresh immediately
    // when the user comes back so they're never looking at old numbers.
    const handleVisibility = () => {
      if (!document.hidden) fetchData();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  return { data, isLoading, error, lastFetchTime, refetch: fetchData };
}
