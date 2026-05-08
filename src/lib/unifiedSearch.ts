import type { AssetType } from "@/types/market";
import type { SearchHit } from "@/types/search";

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Infographics/1.0; +https://github.com/mihirkavi/Infographics) AppleWebKit/537.36",
  Accept: "application/json,text/plain,*/*"
} as const;

interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchange?: string;
}

interface YahooSearchPayload {
  quotes?: YahooSearchQuote[];
}

interface CoinGeckoCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank?: number | null;
}

interface CoinGeckoSearchPayload {
  coins?: CoinGeckoCoin[];
}

function yahooQuoteTypeToAsset(qt: string | undefined): AssetType {
  switch ((qt ?? "").toUpperCase()) {
    case "CRYPTOCURRENCY":
      return "crypto";
    case "CURRENCY":
      return "forex";
    case "FUTURE":
      return "commodity";
    default:
      return "stock";
  }
}

function yahooQuoteToHit(q: YahooSearchQuote): SearchHit | null {
  const symbol = q.symbol?.trim();
  if (!symbol) {
    return null;
  }
  const name = (q.longname || q.shortname || symbol).trim();
  const assetType = yahooQuoteTypeToAsset(q.quoteType);
  return {
    symbol,
    name,
    assetType,
    exchange: q.exchange,
    kind: q.quoteType ?? "UNKNOWN"
  };
}

async function searchYahoo(query: string): Promise<SearchHit[]> {
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", query);
  url.searchParams.set("quotesCount", "28");
  url.searchParams.set("newsCount", "0");
  url.searchParams.set("listsCount", "0");

  const response = await fetch(url.toString(), { cache: "no-store", headers: YAHOO_HEADERS });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as YahooSearchPayload;
  const hits: SearchHit[] = [];
  for (const q of payload.quotes ?? []) {
    const hit = yahooQuoteToHit(q);
    if (hit) {
      hits.push(hit);
    }
  }
  return hits;
}

/** Multiple Yahoo queries in parallel — no hardcoded product→symbol map; Yahoo resolves names to instruments. */
async function searchYahooBroad(normalizedQuery: string): Promise<SearchHit[]> {
  const q = normalizedQuery.trim();
  if (q.length < 1) {
    return [];
  }

  const variants = Array.from(
    new Set([q, `${q} ETF`, `${q} stock`, `${q} futures`, `${q} fund`, `${q} ADR`])
  ).filter((v) => v.length <= 120);

  const batches = await Promise.all(variants.map((variant) => searchYahoo(variant)));
  return batches.flat();
}

function coingeckoToHit(coin: CoinGeckoCoin): SearchHit {
  const sym = coin.symbol.toUpperCase();
  return {
    symbol: `${sym}-USD`,
    name: `${coin.name} (${sym})`,
    assetType: "crypto",
    kind: "CRYPTOCURRENCY",
    footnote: "CoinGecko match → USD pair chart."
  };
}

async function searchCoinGecko(query: string): Promise<SearchHit[]> {
  if (query.trim().length < 2) {
    return [];
  }
  const url = new URL("https://api.coingecko.com/api/v3/search");
  url.searchParams.set("query", query.trim());

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as CoinGeckoSearchPayload;
  const coins = payload.coins ?? [];
  return coins.slice(0, 12).map(coingeckoToHit);
}

/**
 * Only accept explicit symbols (not English words): futures/forex suffixes, indices, FX/crypto pairs,
 * international tickers, or $BRK style — avoids treating "milk" as a ticker.
 */
function directSymbolHit(raw: string): SearchHit | null {
  const trimmed = raw.trim();
  const hasDollar = trimmed.startsWith("$");
  const core = hasDollar ? trimmed.slice(1).trim() : trimmed;
  if (!core.length || core.includes(" ")) {
    return null;
  }
  if (!/^[\^]?[A-Za-z0-9=\.\-]+$/.test(core)) {
    return null;
  }

  const upper = core.toUpperCase();

  const structuredSymbol =
    upper.includes("=") ||
    core.includes("^") ||
    /-[A-Z]{3,5}$/.test(upper) ||
    /\.[A-Z]{1,3}$/.test(upper);

  const shortUpperTicker = /^[A-Z]{1,5}$/.test(upper) && hasDollar;

  if (!structuredSymbol && !shortUpperTicker) {
    return null;
  }

  let assetType: AssetType = "stock";
  if (/=X$/.test(upper)) {
    assetType = "forex";
  } else if (/=F$/.test(upper)) {
    assetType = "commodity";
  } else if (/-USD$/.test(upper) || /-USDT$/.test(upper)) {
    assetType = "crypto";
  }

  return {
    symbol: upper,
    name: `${upper} (symbol)`,
    assetType,
    kind: "DIRECT",
    footnote: "Parsed as a Yahoo Finance symbol—verify it lists on an exchange."
  };
}

function dedupeHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    const key = `${h.assetType}:${h.symbol.toUpperCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(h);
  }
  return out;
}

/** Prefer Yahoo instruments first, then crypto, then explicit symbol. */
function mergeSearchResults(yahoo: SearchHit[], gecko: SearchHit[], direct: SearchHit | null): SearchHit[] {
  const ordered: SearchHit[] = [...yahoo, ...gecko];
  if (direct) {
    const dup = ordered.some(
      (h) => h.symbol.toUpperCase() === direct.symbol.toUpperCase() && h.assetType === direct.assetType
    );
    if (!dup) {
      ordered.unshift(direct);
    }
  }
  return dedupeHits(ordered);
}

const FALLBACK_FOOTNOTE =
  "No Yahoo listing for that exact phrase—these are liquid, related instruments found via Yahoo search (not a retail price).";

/**
 * When the user types plain language (e.g. "tomatoes"), Yahoo returns zero quotes.
 * We run additional Yahoo *search* queries (ETF names, sectors)—still no hardcoded symbol table,
 * only discovery strings that Yahoo resolves to real tickers.
 */
function categoryDiscoveryQueries(userQuery: string): string[] {
  const q = userQuery.toLowerCase().trim();
  const out: string[] = [];

  if (
    /tomato|lettuce|potato|onion|carrot|banana|berry|pepper|garlic|broccoli|celery|spinach|kale|salad|greens|cucumber|mushroom|avocado|vegetable|produce|grocery|organic food|farmer|crop|harvest|orchard|egg\b|milk|dairy|butter|cheese\b|yogurt|beef|pork|chicken|turkey|lamb|wheat|corn|maize|oat|barley|rice\b|bean|lentil|pea\b|soy|coffee|sugar|cocoa|oil seed|palm oil|food(?!\s*$)/.test(
      q
    )
  ) {
    out.push(
      "Invesco DB Agriculture Fund",
      "agriculture ETF",
      "DBA",
      "Teucrium Corn Fund",
      "Elements Agriculture Total Return",
      "wheat ETF WEAT"
    );
  }

  if (/iphone|ipad|airpod|smartphone|android phone|galaxy s|pixel phone|smart phone|handset/.test(q)) {
    out.push("Apple Inc", "Samsung Electronics stock", "Alphabet Class A");
  }

  if (
    /toyota|honda|ford\b|chevrolet|chevy|cadillac|gmc\b|tesla|bmw|mercedes|hyundai|kia|nissan|subaru|mazda|volkswagen|vw\b|audi|porsche|pickup|sedan|suv|vehicle|car\b|auto\b|automotive/.test(
      q
    )
  ) {
    out.push("Toyota Motor", "Ford Motor Company", "Tesla Inc", "Global X Autonomous Electric Vehicles ETF");
  }

  if (/gold\b|silver\b|copper\b|platinum|wti|brent|crude|oil\b|gasoline|natural gas|heating oil/.test(q)) {
    out.push("SPDR Gold Shares", "silver futures", "WTI crude oil futures", "United States Oil Fund");
  }

  return [...new Set(out)].slice(0, 10);
}

async function discoverRelatedInstruments(userQuery: string): Promise<SearchHit[]> {
  const queries = categoryDiscoveryQueries(userQuery);
  if (!queries.length) {
    return [];
  }
  const batches = await Promise.all(queries.map((phrase) => searchYahoo(phrase)));
  return dedupeHits(batches.flat()).map((hit) => ({
    ...hit,
    footnote: hit.footnote ?? FALLBACK_FOOTNOTE,
    kind: hit.kind === "UNKNOWN" ? "DISCOVERY" : hit.kind
  }));
}

export async function unifiedSearch(rawQuery: string): Promise<SearchHit[]> {
  const query = rawQuery.trim();
  if (query.length < 1) {
    return [];
  }

  const direct = directSymbolHit(query);

  const [yahooBroad, geckoHits] = await Promise.all([searchYahooBroad(query), searchCoinGecko(query)]);

  let merged = mergeSearchResults(yahooBroad, geckoHits, direct);

  if (merged.length === 0) {
    const discovered = await discoverRelatedInstruments(query);
    merged = dedupeHits([...merged, ...discovered]);
  }

  return merged;
}
