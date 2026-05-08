"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { AssetOption, AssetType } from "@/types/market";

interface AssetSelectorProps {
  options: AssetOption[];
  selected: AssetOption;
  onSelect: (next: AssetOption) => void;
}

const labels: Record<AssetType, string> = {
  stock: "Stocks",
  forex: "Forex",
  crypto: "Crypto",
  commodity: "Commodities"
};

export function AssetSelector({ options, selected, onSelect }: AssetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<AssetType | "all">("all");

  const filteredOptions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return options.filter((option) => {
      const byType = filter === "all" || option.assetType === filter;
      const bySearch =
        !normalized ||
        option.symbol.toLowerCase().includes(normalized) ||
        option.label.toLowerCase().includes(normalized);
      return byType && bySearch;
    });
  }, [filter, options, searchTerm]);

  return (
    <section className="panel">
      <div className="selector-header">
        <h2>Pick an asset</h2>
        <p>Search across products, currencies, and financial instruments.</p>
      </div>

      <div className="search-box">
        <Search size={16} />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search symbol or name"
          aria-label="Search assets"
        />
      </div>

      <div className="asset-filters">
        {(["all", "stock", "forex", "crypto", "commodity"] as const).map((assetType) => (
          <button
            key={assetType}
            type="button"
            className={filter === assetType ? "pill active" : "pill"}
            onClick={() => setFilter(assetType)}
          >
            {assetType === "all" ? "All" : labels[assetType]}
          </button>
        ))}
      </div>

      <div className="asset-list">
        {filteredOptions.map((option) => (
          <button
            key={`${option.assetType}-${option.symbol}`}
            type="button"
            onClick={() => onSelect(option)}
            className={selected.symbol === option.symbol && selected.assetType === option.assetType ? "asset-row active" : "asset-row"}
          >
            <span>
              <strong>{option.symbol}</strong>
              <small>{option.label}</small>
            </span>
            <em>{labels[option.assetType]}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
