#!/usr/bin/env node
/**
 * Automatic tax-rates updater for Salary-Calculator
 * -------------------------------------------------
 * Runs on YOUR SERVER (not in the browser).
 * Fetches public official pages where possible and updates rates.json.
 *
 * Install once:  node is enough (no npm packages required)
 * Run once:      node update-rates.mjs
 * Every 3 months (cron example):
 *   0 3 1 1,4,7,10 * cd /path/to/app && node update-rates.mjs >> update-rates.log 2>&1
 *
 * After this writes rates.json, the website auto-loads it within 3 months
 * (or immediately if the user clicks «بررسی به‌روزرسانی»).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RATES_PATH = path.join(__dirname, 'rates.json');

function loadRates() {
  try {
    return JSON.parse(fs.readFileSync(RATES_PATH, 'utf8'));
  } catch {
    return { version: '0', countries: {}, changelog: [] };
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Salary-Calculator-Updater/1.0 (+https://github.com/masoudkelaye/Salary-Calculator)',
      Accept: 'text/html,application/json',
    },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

/** UK — parse GOV.UK income tax rates page */
async function fetchUK() {
  const url = 'https://www.gov.uk/income-tax-rates';
  const html = await fetchText(url);
  const out = { source: url, fetchedAt: new Date().toISOString() };

  // Personal Allowance e.g. £12,570
  const pa = html.match(/Personal Allowance[^£]{0,80}£([\d,]+)/i)
    || html.match(/standard Personal Allowance is £([\d,]+)/i);
  if (pa) out.personalAllowance = parseInt(pa[1].replace(/,/g, ''), 10);

  // Basic rate 20%
  if (/Basic rate[\s\S]{0,40}20\s*%/i.test(html)) out.basicRate = 0.2;
  if (/Higher rate[\s\S]{0,40}40\s*%/i.test(html)) out.higherRate = 0.4;
  if (/Additional rate[\s\S]{0,80}45\s*%/i.test(html)) out.additionalRate = 0.45;

  // Band text: £12,571 to £50,270 → basic threshold from PA is ~37700
  const basicBand = html.match(/Basic rate[\s\S]{0,120}?£([\d,]+)\s+to\s+£([\d,]+)/i);
  if (basicBand && out.personalAllowance) {
    const to = parseInt(basicBand[2].replace(/,/g, ''), 10);
    out.basicThreshold = to - out.personalAllowance; // taxable income band width
  }

  out.year = 'from GOV.UK';
  return out;
}

/** Germany — Sozialversicherungssätze from public summary pages (best-effort) */
async function fetchDE() {
  // Official detailed PAP is not a simple JSON API; keep known 2026 defaults
  // and only bump "checked" timestamp. Extend here when a stable feed exists.
  return {
    source: 'embedded-2026-defaults + check timestamp',
    fetchedAt: new Date().toISOString(),
    kv_allgemein: 0.146,
    zusatz_default: 0.025,
    rv: 0.186,
    av: 0.026,
    pv: 0.034,
    minijob_limit: 603,
    midijob_upper: 2000,
    year: 2026,
    note: 'BMF PAP is applied in the app via lohnsteuerrechner; SV rates are defaults for 2026',
  };
}

/** Ukraine — flat rates are stable; reconfirm structure */
async function fetchUA() {
  return {
    source: 'statutory flat rates',
    fetchedAt: new Date().toISOString(),
    pit: 0.18,
    military: 0.05,
    year: 2026,
  };
}

async function main() {
  const rates = loadRates();
  const changes = [];

  const jobs = [
    ['UK', fetchUK],
    ['DE', fetchDE],
    ['UA', fetchUA],
  ];

  for (const [code, fn] of jobs) {
    try {
      const data = await fn();
      const prev = rates.countries[code] || {};
      rates.countries[code] = { ...prev, ...data };
      changes.push(`${code}: OK (${data.source || 'ok'})`);
      console.log('✓', code, data);
    } catch (e) {
      changes.push(`${code}: FAIL ${e.message}`);
      console.error('✗', code, e.message);
    }
  }

  const now = new Date();
  const ver = `${now.getUTCFullYear()}.${String(now.getUTCMonth() + 1).padStart(2, '0')}.${String(now.getUTCDate()).padStart(2, '0')}`;
  rates.version = ver;
  rates.updated = now.toISOString();
  rates.notes = 'Auto-updated by update-rates.mjs on the server. Browser loads this file.';
  rates.changelog = rates.changelog || [];
  rates.changelog.unshift(`${ver} – auto update: ${changes.join('; ')}`);
  rates.changelog = rates.changelog.slice(0, 20);

  fs.writeFileSync(RATES_PATH, JSON.stringify(rates, null, 2) + '\n', 'utf8');
  console.log('\nWrote', RATES_PATH);
  console.log('version', rates.version);
  console.log('Next: website will pick this up on next auto-check (≤3 months) or manual button.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
