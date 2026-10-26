# Banner source

`banner.html` is the editable source of the README banner (`../banner-light.png` and `../banner-dark.png`). It is a single self-contained page: Google Fonts, inline CSS and SVG, and the project mark loaded by relative path from `../../../assets/brand/logo.png`. One `@media (prefers-color-scheme: dark)` block switches it to the dark palette.

## Identity

- **Fonts:** Plus Jakarta Sans 800 for the headline and wordmark (a crisp geometric sans, in the spirit of the geometric headline faces used by charting products such as TradingView), Inter for body text (the font the app itself loads in `src/app/layout.tsx`) and JetBrains Mono for tabular labels and ranges.
- **Colours:** taken from the app's own tokens in `src/app/globals.css`: slate `#0f172a`, teal `#0d9488` / `#2dd4bf` (dark), sky `#0ea5e9` / `#38bdf8` (the app's hero gradient), cool greys `#f4f6f8`, `#e8ecf1`, `#64748b`, and dark surfaces `#0b0f14`, `#111827`.
- **Layout and motif:** left-aligned headline, a chart-paper grid background and a search card that mirrors the real UI: search box, asset-class tags, the `1m`–`1d` range pills and a teal area line. The line is drawn by hand and labelled "Illustration · not market data"; it shows no prices.
- **README styling:** no emoji, shields badges in slate `0f172a`, teal `0d9488` and grey `64748b`.

## Re-rendering

To re-render both banners after editing `banner.html` (from the repository root, with Node and Playwright's Chromium available):

```bash
node render-html.mjs .github/assets/source/banner.html .github/assets/banner-light.png --scheme light
node render-html.mjs .github/assets/source/banner.html .github/assets/banner-dark.png --scheme dark
```

`render-html.mjs` is a small Playwright script (not kept in this repository) that opens the HTML at 1600 × 600, waits for Google Fonts, sets `prefers-color-scheme` and saves a 2× PNG. Any headless browser screenshot at that size works the same way: open the file, emulate the colour scheme, capture 1600 × 600 at device scale factor 2.

## Notes for agents

- Keep the banner free of personal data, secrets and invented results. Illustrative graphics must stay labelled as illustrations.
- Keep the canvas at 1600 × 600 unless the README is updated to match.
- Re-render both PNGs and view them before committing; check for overflow and contrast in both schemes.
