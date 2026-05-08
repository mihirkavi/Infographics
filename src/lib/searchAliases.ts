import type { AssetType } from "@/types/market";

export interface AliasHit {
  symbol: string;
  name: string;
  assetType: AssetType;
  /** Yahoo Finance symbol if different from `symbol` (e.g. equity ticker for a product query). */
  tradeSymbol: string;
  footnote?: string;
}

const ALIASES: Array<{ keys: string[]; hit: AliasHit }> = [
  {
    keys: ["iphone", "iphone 16", "iphone 15", "apple phone", "ipad", "airpods"],
    hit: {
      symbol: "AAPL",
      tradeSymbol: "AAPL",
      name: "Apple Inc.",
      assetType: "stock",
      footnote: "Listed equity (AAPL)—not retail device MSRP."
    }
  },
  {
    keys: ["samsung", "galaxy", "android phone"],
    hit: {
      symbol: "005930.KS",
      tradeSymbol: "005930.KS",
      name: "Samsung Electronics",
      assetType: "stock",
      footnote: "Listed equity—not handset retail price."
    }
  },
  {
    keys: ["google pixel", "pixel phone"],
    hit: {
      symbol: "GOOGL",
      tradeSymbol: "GOOGL",
      name: "Alphabet Inc.",
      assetType: "stock",
      footnote: "Listed equity—proxy for hardware ecosystem."
    }
  },
  {
    keys: ["toyota", "camry", "corolla"],
    hit: {
      symbol: "TM",
      tradeSymbol: "TM",
      name: "Toyota Motor",
      assetType: "stock",
      footnote: "Listed ADR—not dealer sticker price."
    }
  },
  {
    keys: ["ford", "f-150", "f150", "mustang"],
    hit: {
      symbol: "F",
      tradeSymbol: "F",
      name: "Ford Motor",
      assetType: "stock",
      footnote: "Listed equity—not vehicle MSRP."
    }
  },
  {
    keys: ["gm", "chevrolet", "chevy", "cadillac"],
    hit: {
      symbol: "GM",
      tradeSymbol: "GM",
      name: "General Motors",
      assetType: "stock",
      footnote: "Listed equity—not vehicle MSRP."
    }
  },
  {
    keys: ["tesla", "model 3", "model y", "cybertruck"],
    hit: {
      symbol: "TSLA",
      tradeSymbol: "TSLA",
      name: "Tesla Inc.",
      assetType: "stock",
      footnote: "Listed equity—not vehicle MSRP."
    }
  },
  {
    keys: ["bmw"],
    hit: {
      symbol: "BMW.DE",
      tradeSymbol: "BMW.DE",
      name: "BMW AG",
      assetType: "stock",
      footnote: "Listed equity—not vehicle MSRP."
    }
  },
  {
    keys: ["mercedes", "mercedes-benz"],
    hit: {
      symbol: "MBG.DE",
      tradeSymbol: "MBG.DE",
      name: "Mercedes-Benz Group",
      assetType: "stock",
      footnote: "Listed equity—not vehicle MSRP."
    }
  },
  {
    keys: ["corn", "maize"],
    hit: {
      symbol: "ZC=F",
      tradeSymbol: "ZC=F",
      name: "Corn futures (CBOT)",
      assetType: "commodity",
      footnote: "Front-month futures—proxy for wholesale grain, not grocery shelf price."
    }
  },
  {
    keys: ["wheat"],
    hit: {
      symbol: "ZW=F",
      tradeSymbol: "ZW=F",
      name: "Wheat futures (CBOT)",
      assetType: "commodity",
      footnote: "Futures contract—not retail flour or bread price."
    }
  },
  {
    keys: ["soybean", "soybeans"],
    hit: {
      symbol: "ZS=F",
      tradeSymbol: "ZS=F",
      name: "Soybean futures (CBOT)",
      assetType: "commodity",
      footnote: "Futures—not grocery tofu or oil shelf price."
    }
  },
  {
    keys: ["coffee"],
    hit: {
      symbol: "KC=F",
      tradeSymbol: "KC=F",
      name: "Coffee futures",
      assetType: "commodity",
      footnote: "ICE coffee futures—not café menu price."
    }
  },
  {
    keys: ["sugar"],
    hit: {
      symbol: "SB=F",
      tradeSymbol: "SB=F",
      name: "Sugar #11 futures",
      assetType: "commodity",
      footnote: "Futures—not supermarket bag price."
    }
  },
  {
    keys: ["orange juice", "oj", "oranges"],
    hit: {
      symbol: "OJ=F",
      tradeSymbol: "OJ=F",
      name: "Orange juice futures",
      assetType: "commodity",
      footnote: "Futures—not retail juice carton price."
    }
  },
  {
    keys: ["cattle", "beef", "live cattle"],
    hit: {
      symbol: "LE=F",
      tradeSymbol: "LE=F",
      name: "Live cattle futures",
      assetType: "commodity",
      footnote: "Futures—not grocery beef price."
    }
  },
  {
    keys: ["tomato", "tomatoes", "lettuce", "potato", "potatoes", "onion", "carrot", "vegetables"],
    hit: {
      symbol: "DBA",
      tradeSymbol: "DBA",
      name: "Invesco DB Agriculture Fund",
      assetType: "stock",
      footnote: "ETF basket—broad agriculture exposure, not a single vegetable price."
    }
  },
  {
    keys: ["rice"],
    hit: {
      symbol: "ZR=F",
      tradeSymbol: "ZR=F",
      name: "Rough rice futures",
      assetType: "commodity",
      footnote: "Futures—not retail rice bag price."
    }
  }
];

function queryHasPhrase(query: string, phrase: string): boolean {
  if (query === phrase) {
    return true;
  }
  if (query.startsWith(`${phrase} `) || query.endsWith(` ${phrase}`)) {
    return true;
  }
  return query.includes(` ${phrase} `);
}

export function resolveAlias(rawQuery: string): AliasHit | null {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) {
    return null;
  }
  for (const { keys, hit } of ALIASES) {
    if (keys.some((k) => queryHasPhrase(q, k))) {
      return { ...hit };
    }
  }
  return null;
}
