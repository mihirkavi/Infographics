import { z } from "zod";

import type { AssetType, PricePoint, PriceQuery, PriceSeries, TimeRange } from "@/types/market";

const RANGE_CONFIG: Record<TimeRange, { points: number; interval: string; msStep: number }> = {
  "1m": { points: 60, interval: "1min", msStep: 60_000 },
  "5m": { points: 60, interval: "5min", msStep: 300_000 },
  "15m": { points: 60, interval: "15min", msStep: 900_000 },
  "1h": { points: 72, interval: "1h", msStep: 3_600_000 },
  "1d": { points: 90, interval: "1day", msStep: 86_400_000 }
};

const valuesSchema = z.object({
  datetime: z.string(),
  close: z.string()
});

const twelveDataSchema = z.object({
  status: z.string().optional(),
  values: z.array(valuesSchema).optional()
});

type Provider = (query: PriceQuery) => Promise<PriceSeries>;

const providerByAsset: Record<AssetType, Provider> = {
  stock: fetchFromTwelveDataOrDemo,
  forex: fetchFromTwelveDataOrDemo,
  commodity: fetchFromTwelveDataOrDemo,
  crypto: fetchCryptoFromBinanceOrTwelveData
};

export async function getPriceSeries(query: PriceQuery): Promise<PriceSeries> {
  const provider = providerByAsset[query.assetType];
  if (!provider) {
    throw new Error(`Unsupported asset type: ${query.assetType}`);
  }
  return provider(query);
}

async function fetchFromTwelveDataOrDemo(query: PriceQuery): Promise<PriceSeries> {
  if (!process.env.TWELVE_DATA_API_KEY) {
    return buildDemoSeries(query, "demo-simulated");
  }

  const config = RANGE_CONFIG[query.range];
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", query.symbol);
  url.searchParams.set("interval", config.interval);
  url.searchParams.set("outputsize", String(config.points));
  url.searchParams.set("apikey", process.env.TWELVE_DATA_API_KEY);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed data fetch (${response.status})`);
  }

  const json = await response.json();
  const parsed = twelveDataSchema.parse(json);

  if (parsed.status === "error" || !parsed.values?.length) {
    throw new Error("Upstream provider returned no values");
  }

  const points = parsed.values
    .map((entry): PricePoint | null => {
      const date = new Date(entry.datetime);
      const price = Number(entry.close);
      if (Number.isNaN(date.valueOf()) || Number.isNaN(price)) {
        return null;
      }
      return { timestamp: date.valueOf(), price };
    })
    .filter((point): point is PricePoint => point !== null)
    .reverse();

  return {
    symbol: query.symbol,
    assetType: query.assetType,
    points,
    lastUpdated: Date.now(),
    source: "twelvedata"
  };
}

async function fetchCryptoFromBinanceOrTwelveData(query: PriceQuery): Promise<PriceSeries> {
  // Binance provides free, high-frequency crypto candles for popular USD pairs.
  const binanceSymbol = toBinanceSymbol(query.symbol);
  if (binanceSymbol) {
    try {
      return await fetchFromBinance(query, binanceSymbol);
    } catch {
      // Fall back to TwelveData/demo for unsupported pairs or temporary failures.
    }
  }
  return fetchFromTwelveDataOrDemo(query);
}

function toBinanceSymbol(symbol: string): string | null {
  const clean = symbol.replace(/[^\w]/g, "").toUpperCase();
  if (!clean) {
    return null;
  }

  if (clean.endsWith("USDT") || clean.endsWith("USD")) {
    return clean.replace("USD", "USDT");
  }

  if (clean.length <= 6) {
    return `${clean}USDT`;
  }

  return null;
}

async function fetchFromBinance(query: PriceQuery, symbol: string): Promise<PriceSeries> {
  const config = RANGE_CONFIG[query.range];
  const intervalMap: Record<TimeRange, string> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "1d": "1d"
  };

  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", intervalMap[query.range]);
  url.searchParams.set("limit", String(Math.min(config.points, 1000)));

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Binance request failed (${response.status})`);
  }

  const rows = (await response.json()) as unknown[];
  const points = rows
    .map((row): PricePoint | null => {
      if (!Array.isArray(row) || row.length < 5) {
        return null;
      }
      const timestamp = Number(row[0]);
      const close = Number(row[4]);
      if (Number.isNaN(timestamp) || Number.isNaN(close)) {
        return null;
      }
      return { timestamp, price: close };
    })
    .filter((point): point is PricePoint => point !== null);

  if (!points.length) {
    throw new Error("No Binance chart points found");
  }

  return {
    symbol: query.symbol,
    assetType: query.assetType,
    points,
    lastUpdated: Date.now(),
    source: "binance"
  };
}

function buildDemoSeries(query: PriceQuery, source: string): PriceSeries {
  const config = RANGE_CONFIG[query.range];
  const now = Date.now();
  const points: PricePoint[] = [];
  const seedBase = Array.from(query.symbol).reduce((total, char) => total + char.charCodeAt(0), 0);
  let current = Math.max(10, seedBase % 300) + 50;

  for (let i = config.points - 1; i >= 0; i -= 1) {
    const timestamp = now - i * config.msStep;
    const drift = Math.sin((timestamp / config.msStep) * 0.35 + seedBase) * 0.7;
    const noise = (Math.sin(i * 1.3 + seedBase) + Math.cos(i * 0.8 + seedBase)) * 0.18;
    current = Math.max(1, current + drift + noise);
    points.push({ timestamp, price: Number(current.toFixed(4)) });
  }

  return {
    symbol: query.symbol,
    assetType: query.assetType,
    points,
    lastUpdated: now,
    source
  };
}
