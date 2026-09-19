# Salary Calculator 2026

Multi-country net salary calculator with Liquid Glass UI and PWA support.

**Repo:** https://github.com/masoudkelaye/Salary-Calculator

## Features
- 18 countries (DE, FR, IT, NL, UK, US, CA, BE, ES, IR, AU, NZ, SE, NO, DK, FI, IS, UA)
- Language dropdown (FA / EN / DE / FR / IT / NL / ES)
- Installable PWA (iPhone & Android)
- Excel export

## Local full build
The complete single-file calculator is in the project artifacts:

```bash
# Clone
git clone https://github.com/masoudkelaye/Salary-Calculator.git
cd Salary-Calculator

# To restore the full calculator from your local build:
cp /path/to/artifacts/german-net-salary/index.html .
# (the local index.html is a complete single-file app ~160KB)

git add -A
git commit -m "Full calculator with language dropdown and PWA"
git push
```

## Enable GitHub Pages
Settings → Pages → Deploy from branch `main` / root.
Then open `https://masoudkelaye.github.io/Salary-Calculator/`

## PWA install
- **Android Chrome:** menu → Install app
- **iPhone Safari:** Share → Add to Home Screen
(Requires HTTPS — GitHub Pages is fine.)
