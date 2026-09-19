# Net Salary Calculator 2026

Multi-country net salary (take-home pay) calculator with **Liquid Glass** UI.

**Repo:** https://github.com/masoudkelaye/net-salary-calculator

## Supported countries
Germany · France · Italy · Netherlands · UK · USA · Canada · Belgium · Spain · Iran · Australia · New Zealand · Sweden · Norway · Denmark · Finland · Iceland · Ukraine

## Features
- Official 2026 tax rates and social contributions (where available)
- Hourly / weekly / monthly input
- Excel export (SheetJS)
- Multi-language: FA, EN, DE, FR, IT, NL, ES
- Second job + country-specific optional overrides
- Liquid Glass modern UI

## Quick start

The full single-file app lives at:

```text
artifacts/german-net-salary/index.html
```

### Option A — open locally
1. Download `index.html` from this repo (or from your local build).
2. Open it in a browser (double-click or `npx serve .`).

### Option B — GitHub Pages
1. Push the full `index.html` to `main`.
2. Settings → Pages → Deploy from branch `main` / root.

### Option C — replace placeholder
If you only see a shell page, replace `index.html` with the complete calculator file from your local artifacts folder:

```bash
git clone https://github.com/masoudkelaye/net-salary-calculator.git
cd net-salary-calculator
# copy your full index.html here, then:
git add index.html styles.css
git commit -m "Add full calculator"
git push
```

## Stack
- Vanilla HTML / CSS / JS (single file or split)
- [lohnsteuerrechner](https://www.npmjs.com/package/lohnsteuerrechner) for German PAP
- SheetJS for Excel export

## License
MIT — use freely for personal or commercial projects.
