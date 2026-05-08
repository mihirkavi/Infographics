import type { AssetType } from "@/types/market";
import type { SearchHit } from "@/types/search";

import { resolveAlias } from "@/lib/searchAliases";

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
  url.searchParams.set("quotesCount", "18");
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

function coingeckoToHit(coin: CoinGeckoCoin): SearchHit {
  const sym = coin.symbol.toUpperCase();
  return {
    symbol: `${sym}-USD`,
    name: `${coin.name} (${sym})`,
    assetType: "crypto",
    kind: "CRYPTOCURRENCY",
    footnote: "Crypto spot chart via exchange/Yahoo pair—CoinGecko match."
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
  return coins.slice(0, 8).map(coingeckoToHit);
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

export async function unifiedSearch(rawQuery: string): Promise<SearchHit[]> {
  const query = rawQuery.trim();
  if (query.length < 1) {
    return [];
  }

  const alias = resolveAlias(query);
  const aliasHits: SearchHit[] = alias
    ? [
        {
          symbol: alias.tradeSymbol,
          name: alias.name,
          assetType: alias.assetType,
          kind: "ALIAS",
          footnote: alias.footnote
        }
      ]
    : [];

  const [yahooHits, geckoHits] = await Promise.all([searchYahoo(query), searchCoinGecko(query)]);

  return dedupeHits([...aliasHits, ...yahooHits, ...geckoHits]);
}
