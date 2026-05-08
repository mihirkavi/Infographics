# Infographics — Pulse Markets Dashboard

**Project / repository:** `Infographics` (workspace folder and canonical project name). The npm package name is `infographics` (lowercase, per npm rules).

A real-time market dashboard built with Next.js that supports:

- Stocks
- Forex
- Crypto
- Commodities

## Data sources (real market data, no simulated series)

All chart data comes from **live public HTTP APIs** (no demo series):

| Asset class | Source | How this app uses it |
|-------------|--------|----------------------|
| Stocks, forex, commodities | **Yahoo Finance chart API** (`/v8/finance/chart`) | `fetch` in [`src/lib/marketData.ts`](src/lib/marketData.ts) — same class of endpoint many OSS clients wrap |
| Crypto | **Binance** public REST (`/api/v3/klines`) | `fetch` — exchange candlesticks; falls back to Yahoo `BTC-USD`-style symbols if the pair is not on Binance |

**Related open-source libraries** (not required here, but useful for research or richer features):

- **[yahoo-finance2](https://github.com/gadicc/yahoo-finance2)** (MIT) — higher-level Yahoo client; current major versions may require **Node 22+**.
- **[CCXT](https://github.com/ccxt/ccxt)** (MIT) — unified access to many crypto exchanges (Binance, Coinbase, Kraken, …).

**Caveats:** Yahoo’s chart endpoint is **unofficial** and can change; delays and limits follow Yahoo. Binance data is real traded candles for liquid `*USDT` pairs.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

No API keys are required for the default Yahoo + Binance pipeline.

## Git

Remote: `https://github.com/mihirkavi/Infographics.git`

```bash
git remote add origin https://github.com/mihirkavi/Infographics.git
git push -u origin main
```

## Symbol notes

- **Forex** uses Yahoo currency tickers, e.g. `EUR/USD` → `EURUSD=X`.
- **Commodities** map to common Yahoo futures symbols: gold `GC=F`, silver `SI=F`, WTI oil `CL=F`.
- **Crypto** uses Binance klines when the pair maps to a `*USDT` symbol; otherwise Yahoo pairs like `BTC-USD`.
