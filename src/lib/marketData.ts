import type { AssetType, PricePoint, PriceQuery, PriceSeries, TimeRange } from "@/types/market";

const RANGE_CONFIG: Record<TimeRange, { points: number; msStep: number }> = {
  "1m": { points: 60, msStep: 60_000 },
  "5m": { points: 60, msStep: 300_000 },
  "15m": { points: 60, msStep: 900_000 },
  "1h": { points: 72, msStep: 3_600_000 },
  "1d": { points: 90, msStep: 86_400_000 }
};

/** Yahoo Finance chart API (v8) query params — public HTTP endpoint used by many OSS tools. */
const YAHOO_CHART_QUERY: Record<TimeRange, { interval: string; range: string }> = {
  "1m": { interval: "1m", range: "1d" },
  "5m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "1mo" },
  "1h": { interval: "1h", range: "3mo" },
  "1d": { interval: "1d", range: "2y" }
};

const BINANCE_INTERVAL: Record<TimeRange, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "1d": "1d"
};

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Infographics/1.0; +https://github.com/mihirkavi/Infographics) AppleWebKit/537.36",
  Accept: "application/json,text/plain,*/*"
} as const;

type Provider = (query: PriceQuery) => Promise<PriceSeries>;

function seriesLabels(query: PriceQuery): Pick<PriceSeries, "symbol" | "name" | "footnote"> {
  return {
    symbol: query.symbol,
    name: query.displayName,
    footnote: query.footnote
  };
}

const providerByAsset: Record<AssetType, Provider> = {
  stock: fetchFromYahooChart,
  forex: fetchFromYahooChart,
  commodity: fetchFromYahooChart,
  crypto: fetchCryptoFromBinanceOrYahoo
};

export async function getPriceSeries(query: PriceQuery): Promise<PriceSeries> {
  const provider = providerByAsset[query.assetType];
  if (!provider) {
    throw new Error(`Unsupported asset type: ${query.assetType}`);
  }
  return provider(query);
}

function resolveYahooSymbol(query: PriceQuery): string {
  const raw = query.symbol.trim();

  if (query.assetType === "forex") {
    const u = raw.replace(/\s/g, "").toUpperCase();
    if (u.endsWith("=X")) {
      return u;
    }
    const pair = u.replace(/\//g, "");
    if (pair.length < 6) {
      throw new Error(`Invalid forex pair: ${query.symbol}`);
    }
    return `${pair}=X`;
  }

  if (query.assetType === "commodity") {
    const u = raw.trim().toUpperCase();
    if (u.endsWith("=F")) {
      return u;
    }
    const key = raw.replace(/\s/g, "").toUpperCase();
    if (key === "XAU/USD" || key === "XAUUSD") {
      return "GC=F";
    }
    if (key === "XAG/USD" || key === "XAGUSD") {
      return "SI=F";
    }
    if (key === "WTI" || key === "CL=F" || key === "CRUDE") {
      return "CL=F";
    }
    if (raw.includes("=")) {
      return raw;
    }
    throw new Error(`Unsupported commodity symbol: ${query.symbol}. Try XAU/USD, XAG/USD, or WTI.`);
  }

  return raw.toUpperCase();
}

function toYahooCryptoPair(symbol: string): string {
  const normalized = symbol.trim().replace(/\s/g, "").replace(/\//g, "-").toUpperCase();
  if (!normalized.includes("-") && normalized.length >= 6) {
    const base = normalized.slice(0, -3);
    const quote = normalized.slice(-3);
    return `${base}-${quote}`;
  }
  return normalized;
}

interface YahooChartPayload {
  chart?: {
    error?: { description?: string };
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
}

async function fetchFromYahooChart(query: PriceQuery): Promise<PriceSeries> {
  const yahooSymbol = resolveYahooSymbol(query);
  const config = RANGE_CONFIG[query.range];
  const { interval, range } = YAHOO_CHART_QUERY[query.range];

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`
  );
  url.searchParams.set("interval", interval);
  url.searchParams.set("range", range);
  url.searchParams.set("includePrePost", "false");

  const response = await fetch(url.toString(), { cache: "no-store", headers: YAHOO_HEADERS });
  if (!response.ok) {
    throw new Error(`Yahoo Finance HTTP ${response.status} for ${yahooSymbol}`);
  }

  const payload = (await response.json()) as YahooChartPayload;
  const err = payload.chart?.error;
  if (err?.description) {
    throw new Error(`Yahoo Finance: ${err.description}`);
  }

  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;

  if (!timestamps?.length || !closes?.length || timestamps.length !== closes.length) {
    throw new Error(`No Yahoo Finance chart rows for ${yahooSymbol}`);
  }

  const points: PricePoint[] = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const close = closes[i];
    if (close == null || Number.isNaN(close)) {
      continue;
    }
    points.push({ timestamp: timestamps[i] * 1000, price: close });
  }

  const trimmed = points.slice(-config.points);

  if (!trimmed.length) {
    throw new Error(`No usable Yahoo Finance prices for ${yahooSymbol}`);
  }

  return {
    ...seriesLabels(query),
    assetType: query.assetType,
    points: trimmed,
    lastUpdated: Date.now(),
    source: "yahoo-chart-v8"
  };
}

async function fetchCryptoFromBinanceOrYahoo(query: PriceQuery): Promise<PriceSeries> {
  const binanceSymbol = toBinanceSymbol(query.symbol);
  if (binanceSymbol) {
    try {
      return await fetchFromBinance(query, binanceSymbol);
    } catch {
      // Fall through to Yahoo (e.g. pair not on Binance).
    }
  }

  const yahooPair = toYahooCryptoPair(query.symbol);
  const yahooSeries = await fetchFromYahooChart({ ...query, symbol: yahooPair, assetType: "stock" });
  return {
    ...yahooSeries,
    ...seriesLabels(query),
    assetType: "crypto",
    source: "yahoo-chart-v8"
  };
}

function toBinanceSymbol(symbol: string): string | null {
  const clean = symbol.replace(/[^\w]/g, "").toUpperCase();
  if (!clean) {
    return null;
  }

  if (clean.endsWith("USDT") || clean.endsWith("USD")) {
    return clean.replace(/USD$/, "USDT");
  }

  if (clean.length <= 6) {
    return `${clean}USDT`;
  }

  return null;
}

async function fetchFromBinance(query: PriceQuery, symbol: string): Promise<PriceSeries> {
  const config = RANGE_CONFIG[query.range];

  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", BINANCE_INTERVAL[query.range]);
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
    ...seriesLabels(query),
    assetType: query.assetType,
    points,
    lastUpdated: Date.now(),
    source: "binance"
  };
}
