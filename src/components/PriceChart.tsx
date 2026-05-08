"use client";

import { Activity, Clock3, TrendingDown, TrendingUp } from "lucide-react";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AssetType, PriceSeries } from "@/types/market";

interface PriceChartProps {
  series: PriceSeries | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  empty: boolean;
}

function formatAxisTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTooltipTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatYAxisTick(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return "";
  }
  if (Math.abs(n) >= 1000) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (Math.abs(n) >= 1) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatPriceValue(price: number, assetType: AssetType): string {
  if (assetType === "forex") {
    return price.toLocaleString(undefined, { maximumFractionDigits: 5 });
  }
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

export function PriceChart({ series, loading, refreshing, error, empty }: PriceChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const points = series?.points ?? [];
  const first = points[0]?.price ?? 0;
  const last = points[points.length - 1]?.price ?? 0;
  const delta = last - first;
  const deltaPct = first ? (delta / first) * 100 : 0;
  const positive = delta >= 0;
  const title = series?.name ?? series?.symbol;
  const assetType = series?.assetType ?? "stock";

  return (
    <section className={`panel chart-panel ${refreshing ? "chart-refreshing" : ""}`}>
      <div className="chart-header">
        <div>
          <h2>Live line chart</h2>
          <p>Updates merge in place—no full-page flicker on each poll.</p>
        </div>
        <div className="chip-row">
          <span className="chip">
            <Clock3 size={14} /> {empty ? "Idle" : loading ? "Loading" : refreshing ? "Updating" : "Live"}
          </span>
          <span className="chip">
            <Activity size={14} /> {series?.source ?? "—"}
          </span>
        </div>
      </div>

      {series && (
        <div className="chart-metrics">
          <h3>
            {title} <small>{series.assetType}</small>
          </h3>
          <p className="chart-price">{formatPriceValue(last, series.assetType)}</p>
          <span className={positive ? "delta up" : "delta down"}>
            {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {series.assetType === "forex" ? delta.toFixed(5) : delta.toFixed(4)} ({deltaPct.toFixed(2)}%)
          </span>
          {series.footnote ? <p className="chart-footnote">{series.footnote}</p> : null}
        </div>
      )}

      {loading && <div className="state">Loading prices…</div>}
      {error && <div className="state error">{error}</div>}
      {empty && !loading && !error && <div className="state">Search for a company, car brand, crop future, or ticker to load a chart.</div>}

      {series && (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={points}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-fill-top)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--chart-fill-bottom)" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="timestamp"
                stroke="var(--chart-axis)"
                tickFormatter={formatAxisTimestamp}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis stroke="var(--chart-axis)" domain={["auto", "auto"]} tickFormatter={formatYAxisTick} />
              <Tooltip
                contentStyle={{
                  background: "var(--tooltip-bg)",
                  border: "1px solid var(--tooltip-border)",
                  borderRadius: "12px",
                  color: "var(--text)"
                }}
                labelFormatter={(value) => formatTooltipTimestamp(Number(value))}
                formatter={(value) => [formatPriceValue(Number(value), assetType), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--chart-line)"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive
                animationDuration={420}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
