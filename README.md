# Infographics — Pulse Markets Dashboard

**Project / repository:** `Infographics` (workspace folder and canonical project name). The npm package name is `infographics` (lowercase, per npm rules).

A beautiful real-time market dashboard built with Next.js that supports:

- Stocks
- Forex
- Crypto
- Commodities

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

Set `TWELVE_DATA_API_KEY` in `.env.local` for live broad-asset data.

3. Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Git

Remote: `https://github.com/mihirkavi/Infographics.git`

```bash
git remote add origin https://github.com/mihirkavi/Infographics.git
git push -u origin main
```

## Notes

- Crypto pairs prefer Binance public candles when possible, then fall back to TwelveData.
- If no API key is configured, the app serves smooth simulated demo data so UI behavior can still be verified end-to-end.
