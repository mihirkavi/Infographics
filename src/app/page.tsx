"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MarketSearch } from "@/components/MarketSearch";
import { PriceChart } from "@/components/PriceChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { PriceSeries, TimeRange } from "@/types/market";
import type { SearchHit } from "@/types/search";

const REFRESH_MS: Record<TimeRange, number> = {
  "1m": 4_000,
  "5m": 6_000,
  "15m": 10_000,
  "1h": 15_000,
  "1d": 20_000
};

interface Selection {
  symbol: string;
  assetType: SearchHit["assetType"];
  displayName: string;
  footnote?: string;
}

export default function HomePage() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [range, setRange] = useState<TimeRange>("1h");
  const [series, setSeries] = useState<PriceSeries | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instrumentRef = useRef<string>("");

  const queryString = useMemo(() => {
    if (!selection) {
      return "";
    }
    const params = new URLSearchParams({
      symbol: selection.symbol,
      assetType: selection.assetType,
      range,
      displayName: selection.displayName
    });
    if (selection.footnote) {
      params.set("footnote", selection.footnote);
    }
    return params.toString();
  }, [range, selection]);

  useEffect(() => {
    if (!selection || !queryString) {
      return;
    }

    const instrumentKey = `${selection.symbol}|${selection.assetType}`;
    const instrumentChanged = instrumentKey !== instrumentRef.current;
    if (instrumentChanged) {
      instrumentRef.current = instrumentKey;
      setSeries(null);
    }

    let cancelled = false;

    async function fetchSeries(isPoll: boolean) {
      setRefreshing(true);
      if (!isPoll) {
        setError(null);
      }

      try {
        const response = await fetch(`/api/prices?${queryString}`, { cache: "no-store" });
        const json = (await response.json()) as PriceSeries | { details?: string | string[]; error?: string };

        if (!response.ok) {
          const body = json as { details?: string | string[]; error?: string };
          const detail = Array.isArray(body.details) ? body.details.join("; ") : body.details;
          throw new Error(detail ?? body.error ?? "Failed to fetch market data");
        }

        if (!cancelled) {
          setSeries(json as PriceSeries);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unexpected market data error");
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    }

    void fetchSeries(false);
    const timer = window.setInterval(() => {
      void fetchSeries(true);
    }, REFRESH_MS[range]);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [queryString, selection, range]);

  const onSearchSelect = (hit: SearchHit) => {
    setSelection({
      symbol: hit.symbol,
      assetType: hit.assetType,
      displayName: hit.name,
      footnote: hit.footnote
    });
    setError(null);
  };

  const showChartLoading = Boolean(selection) && !series && !error;

  return (
    <main className="page-shell">
      <header className="hero">
        <div className="hero-top">
          <div>
            <h1>Pulse Markets</h1>
            <p>One search for stocks, FX, crypto, futures, and popular “real world” proxies.</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <MarketSearch onSelect={onSearchSelect} />

      <section className="time-range-panel" aria-label="Time range">
        {(["1m", "5m", "15m", "1h", "1d"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            className={range === option ? "pill active" : "pill"}
          >
            {option}
          </button>
        ))}
      </section>

      <section className="dashboard-main">
        <PriceChart
          series={series}
          loading={showChartLoading}
          refreshing={refreshing}
          error={error}
          empty={!selection}
        />
      </section>
    </main>
  );
}
