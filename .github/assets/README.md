# README assets

Images used by the repository's root `README.md`.

| File | What it is | How it was made |
| --- | --- | --- |
| `banner-light.png`, `banner-dark.png` | Title banner for light and dark GitHub themes | Rendered at 1600 × 600 (2×) with headless Chrome from [`source/banner.html`](source/banner.html), which uses the project logo from `assets/brand/logo.png`. The chart line in it is an illustration, not market data |
| `hero.jpg` | Desktop and phone views of a live one-hour Bitcoin chart | Production build (`npm run build && npm start`) captured with Playwright on 26 October 2026, framed in a browser window and phone |
| `search.jpg` | Search results for "gold" | Same method |
| `forex-dark.jpg` | One-hour EUR/USD chart in dark appearance | Same method, with `prefers-color-scheme: dark` |
| `stock-daily.jpg` | Daily Apple chart over about two years | Same method |

## Visual identity

Plus Jakarta Sans headlines, Inter body text (the app's font) and JetBrains Mono labels, in the app's own slate `#0f172a`, teal `#0d9488` and sky `#0ea5e9` tokens from `src/app/globals.css`, on a chart-paper grid. The motif is the real search card: search box, asset-class tags, range pills and a live-style area line. Details and re-render commands: [`source/README.md`](source/README.md).

## Notes for agents

- Screenshots must show only public market data or demo data. Never capture personal accounts, keys or private information.
- Retake screenshots from a production build, not `next dev`, so the development badge does not appear.
- Keep file names stable; the root README links to them by path.
- Conceptual artwork lives in `assets/brand/` and must stay labelled as conceptual.
- The banner source lives in `source/`; edit `source/banner.html` and re-render both PNGs rather than editing the images.
