"use client";

import { Activity, Clock3, TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { PriceSeries } from "@/types/market";

interface PriceChartProps {
  series: PriceSeries | null;
  loading: boolean;
  error: string | null;
}

function formatAxisTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTooltipTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function PriceChart({ series, loading, error }: PriceChartProps) {
  const first = series?.points[0]?.price ?? 0;
  const last = series?.points[series.points.length - 1]?.price ?? 0;
  const delta = last - first;
  const deltaPct = first ? (delta / first) * 100 : 0;
  const positive = delta >= 0;

  return (
    <section className="panel chart-panel">
      <div className="chart-header">
        <div>
          <h2>Live market line chart</h2>
          <p>Streaming updates with smooth redraw and validated timeseries.</p>
        </div>
        <div className="chip-row">
          <span className="chip">
            <Clock3 size={14} /> {series ? "Live" : "Waiting"}
          </span>
          <span className="chip">
            <Activity size={14} /> {series?.source ?? "provider"}
          </span>
        </div>
      </div>

      {series && (
        <div className="chart-metrics">
          <h3>
            {series.symbol} <small>{series.assetType}</small>
          </h3>
          <p>${last.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
          <span className={positive ? "delta up" : "delta down"}>
            {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {delta.toFixed(4)} ({deltaPct.toFixed(2)}%)
          </span>
        </div>
      )}

      {loading && <div className="state">Loading live prices...</div>}
      {error && <div className="state error">{error}</div>}
      {!loading && !error && !series && <div className="state">Select an asset to begin.</div>}

      {series && (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={series.points}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c92ff" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#7c92ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f3559" />
              <XAxis
                dataKey="timestamp"
                stroke="#9ba5d3"
                tickFormatter={formatAxisTimestamp}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis
                stroke="#9ba5d3"
                domain={["dataMin - 2", "dataMax + 2"]}
                tickFormatter={(value) => Number(value).toFixed(2)}
              />
              <Tooltip
                contentStyle={{ background: "#121833", border: "1px solid #313963", borderRadius: "12px" }}
                labelFormatter={(value) => formatTooltipTimestamp(Number(value))}
                formatter={(value) => [`$${Number(value).toFixed(6)}`, "Price"]}
              />
              <Area type="monotone" dataKey="price" stroke="#9babff" strokeWidth={2} fillOpacity={1} fill="url(#priceFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
