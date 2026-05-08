"use client";

import { useEffect, useMemo, useState } from "react";

import { AssetSelector } from "@/components/AssetSelector";
import { PriceChart } from "@/components/PriceChart";
import type { AssetOption, PriceSeries, TimeRange } from "@/types/market";

const ASSETS: AssetOption[] = [
  { symbol: "AAPL", label: "Apple Inc.", assetType: "stock" },
  { symbol: "MSFT", label: "Microsoft Corp.", assetType: "stock" },
  { symbol: "TSLA", label: "Tesla Inc.", assetType: "stock" },
  { symbol: "EUR/USD", label: "Euro / US Dollar", assetType: "forex" },
  { symbol: "USD/JPY", label: "US Dollar / Japanese Yen", assetType: "forex" },
  { symbol: "GBP/USD", label: "British Pound / US Dollar", assetType: "forex" },
  { symbol: "BTC/USD", label: "Bitcoin", assetType: "crypto" },
  { symbol: "ETH/USD", label: "Ethereum", assetType: "crypto" },
  { symbol: "SOL/USD", label: "Solana", assetType: "crypto" },
  { symbol: "XAU/USD", label: "Gold", assetType: "commodity" },
  { symbol: "XAG/USD", label: "Silver", assetType: "commodity" },
  { symbol: "WTI", label: "Crude Oil (WTI)", assetType: "commodity" }
];

const REFRESH_MS: Record<TimeRange, number> = {
  "1m": 4_000,
  "5m": 6_000,
  "15m": 10_000,
  "1h": 15_000,
  "1d": 20_000
};

export default function HomePage() {
  const [selectedAsset, setSelectedAsset] = useState<AssetOption>(ASSETS[0]);
  const [range, setRange] = useState<TimeRange>("1h");
  const [series, setSeries] = useState<PriceSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      symbol: selectedAsset.symbol,
      assetType: selectedAsset.assetType,
      range
    });
    return params.toString();
  }, [range, selectedAsset.assetType, selectedAsset.symbol]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchSeries() {
      if (!isCancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(`/api/prices?${queryString}`, { cache: "no-store" });
        const json = (await response.json()) as PriceSeries | { details?: string };

        if (!response.ok) {
          throw new Error((json as { details?: string }).details ?? "Failed to fetch market data");
        }

        if (!isCancelled) {
          setSeries(json as PriceSeries);
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unexpected market data error");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void fetchSeries();
    const timer = window.setInterval(() => {
      void fetchSeries();
    }, REFRESH_MS[range]);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [queryString, range]);

  return (
    <main className="page-shell">
      <header className="hero">
        <h1>Pulse Markets</h1>
        <p>Track any product, service, or financial asset in an elegant real-time market graph.</p>
      </header>

      <section className="time-range-panel">
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

      <section className="dashboard-grid">
        <AssetSelector options={ASSETS} selected={selectedAsset} onSelect={setSelectedAsset} />
        <PriceChart series={series} loading={loading} error={error} />
      </section>
    </main>
  );
}
