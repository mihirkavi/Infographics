import type { AssetType } from "@/types/market";

export interface SearchHit {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange?: string;
  kind: string;
  footnote?: string;
}
