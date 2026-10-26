# README assets

Images used by the repository's root `README.md`.

| File | What it is | How it was made |
| --- | --- | --- |
| `banner-light.png`, `banner-dark.png` | Title banner for light and dark GitHub themes | Rendered from HTML with headless Chrome (a shared banner template), using the project logo from `assets/brand/logo.png` |
| `hero.jpg` | Desktop and phone views of a live one-hour Bitcoin chart | Production build (`npm run build && npm start`) captured with Playwright on 26 October 2026, framed in a browser window and phone |
| `search.jpg` | Search results for "gold" | Same method |
| `forex-dark.jpg` | One-hour EUR/USD chart in dark appearance | Same method, with `prefers-color-scheme: dark` |
| `stock-daily.jpg` | Daily Apple chart over about two years | Same method |

## Notes for agents

- Screenshots must show only public market data or demo data. Never capture personal accounts, keys or private information.
- Retake screenshots from a production build, not `next dev`, so the development badge does not appear.
- Keep file names stable; the root README links to them by path.
- Conceptual artwork lives in `assets/brand/` and must stay labelled as conceptual.
