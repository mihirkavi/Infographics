export type AssetType = "stock" | "forex" | "crypto" | "commodity";

export type TimeRange = "1m" | "5m" | "15m" | "1h" | "1d";

export interface AssetOption {
  symbol: string;
  label: string;
  assetType: AssetType;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface PriceSeries {
  symbol: string;
  assetType: AssetType;
  points: PricePoint[];
  lastUpdated: number;
  source: string;
}

export interface PriceQuery {
  symbol: string;
  assetType: AssetType;
  range: TimeRange;
}
