"use client";

import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { SearchHit } from "@/types/search";

interface MarketSearchProps {
  onSelect: (hit: SearchHit) => void;
}

const DEBOUNCE_MS = 280;

export function MarketSearch({ onSelect }: MarketSearchProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    const id = ++requestId.current;
    if (q.trim().length < 1) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      const json = (await response.json()) as { hits?: SearchHit[]; error?: string };
      if (id !== requestId.current) {
        return;
      }
      if (!response.ok) {
        setHits([]);
        return;
      }
      setHits(json.hits ?? []);
      setActiveIndex(0);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (hit: SearchHit) => {
    onSelect(hit);
    setQuery(hit.name);
    setOpen(false);
    setHits([]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[activeIndex];
      if (hit) {
        pick(hit);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="market-search" ref={wrapRef}>
      <label className="market-search-label" htmlFor="market-search-input">
        Search any tradable symbol or topic
      </label>
      <div className={`market-search-box ${open && hits.length ? "open" : ""}`}>
        <Search size={18} className="market-search-icon" aria-hidden />
        <input
          id="market-search-input"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. iPhone, Toyota, Bitcoin, EUR/USD, corn, AAPL…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading ? <Loader2 className="market-search-spinner" size={18} aria-hidden /> : null}
      </div>
      {open && hits.length > 0 ? (
        <ul className="market-search-results" role="listbox">
          {hits.map((hit, index) => (
            <li key={`${hit.symbol}-${hit.kind}-${index}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "active" : ""}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(hit)}
              >
                <span className="hit-main">
                  <strong>{hit.name}</strong>
                  <em>{hit.symbol}</em>
                </span>
                <span className="hit-meta">
                  <span className="hit-type">{hit.assetType}</span>
                  {hit.exchange ? <span className="hit-ex">{hit.exchange}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="market-search-hint">
        Real quotes from Yahoo Finance &amp; Binance. Consumer searches map to the closest liquid market (equity,
        future, or pair)—not retail shelf prices.
      </p>
    </div>
  );
}
