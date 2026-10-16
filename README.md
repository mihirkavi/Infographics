# Infographics — Pulse Markets Dashboard

<p><img src="assets/brand/logo.png" alt="Infographics logo" width="96" height="96"></p>

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

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Recharts for charts, Zod for API input validation, lucide-react icons.

## Project structure

```text
src/
  app/
    page.tsx              Dashboard page
    api/prices/route.ts   GET /api/prices?symbol=&assetType=&range=  (price series)
    api/search/route.ts   GET /api/search?q=  (symbol search)
  components/             MarketSearch, PriceChart, ThemeToggle
  lib/marketData.ts       Yahoo Finance and Binance fetching
  lib/unifiedSearch.ts    Yahoo Finance and CoinGecko search
  types/                  Shared types
```

`assetType` is one of `stock`, `forex`, `crypto`, `commodity`; `range` is one of `1m`, `5m`, `15m`, `1h`, `1d` (default `1h`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Search behavior

- **No manual alias table**: results come from **Yahoo Finance search** (several query variants merged) and **CoinGecko** for crypto names.
- Type a **name or ticker** Yahoo knows (e.g. `Apple`, `Invesco agriculture ETF`, `EURUSD=X`). Plain English only charts when Yahoo returns a matching **listed** instrument.
- **Retail prices** (grocery MSRP, etc.) are not exposed by market data APIs—only **tradeable** symbols get live charts.

## Symbol notes (charts)

- **Forex** symbols often look like `EURUSD=X` on Yahoo.
- **Futures** use Yahoo suffix `=F`; **crypto** pairs often `COIN-USD`.
- **Crypto** chart uses Binance when the pair maps to `*USDT`; otherwise Yahoo `*-USD` style data.

## License

[GNU General Public License v3.0](LICENSE).

<!-- project-artwork:start -->
## Project artwork

![Conceptual artwork for Infographics](assets/brand/cover.png)

Conceptual project artwork. [Asset files, design notes, and generation prompts](assets/brand/README.md).
<!-- project-artwork:end -->
