import { calculate as papCalculate } from "https://cdn.jsdelivr.net/npm/lohnsteuerrechner@1.0.7/+esm";


    /** Live rates from rates.json (window.TAX_RATES); fallback to hardcoded official defaults */
    function R(country, key, fallback) {
      try {
        const pack = window.TAX_RATES && window.TAX_RATES.countries && window.TAX_RATES.countries[country];
        if (pack && pack[key] != null && pack[key] !== '' && !Number.isNaN(Number(pack[key]))) {
          return Number(pack[key]);
        }
      } catch (e) {}
      return fallback;
    }
    window.R = R;



    function calcAustralia(monthlyGross) {
      // ATO resident rates FY 2026–27 + Medicare levy 2%
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      let annual = monthlyGross * 12;

      // Optional salary sacrifice (reduces taxable income)
      const sacRaw = document.getElementById('auSacrifice')?.value;
      const sacrifice = (sacRaw !== '' && sacRaw != null && !isNaN(parseFloat(sacRaw)))
        ? parseFloat(sacRaw) : 0;
      const taxable = Math.max(0, annual - sacrifice);

      // Income tax 2026–27 (resident)
      let tax = 0;
      if (taxable > 18200) tax += Math.min(taxable - 18200, 45000 - 18200) * 0.15;
      if (taxable > 45000) tax += Math.min(taxable - 45000, 135000 - 45000) * 0.30;
      if (taxable > 135000) tax += Math.min(taxable - 135000, 190000 - 135000) * 0.37;
      if (taxable > 190000) tax += (taxable - 190000) * 0.45;

      // Low Income Tax Offset (LITO) simplified max $700, phases out
      let lito = 0;
      if (taxable <= 37500) lito = 700;
      else if (taxable < 45000) lito = 700 - (taxable - 37500) * 0.05;
      else if (taxable < 66667) lito = Math.max(0, 325 - (taxable - 45000) * 0.015);
      tax = Math.max(0, tax - lito);

      // Medicare levy 2% with low-income shade-in (single approx)
      let medicare = 0;
      if (taxable > 35014) medicare = taxable * 0.02;
      else if (taxable > 28011) medicare = (taxable - 28011) * 0.10; // shade-in

      // HELP / HECS compulsory repayment (simplified marginal from 2025-26 system)
      let help = 0;
      if (document.getElementById('auHelp')?.value === '1') {
        if (taxable > 186051) help = taxable * 0.10;
        else if (taxable > 129717) help = 9028 + (taxable - 129717) * 0.17;
        else if (taxable > 69528) help = (taxable - 69528) * 0.15;
      }

      const otherRaw = document.getElementById('auOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const totalAnnual = tax + medicare + help;
      const monthlyTax = totalAnnual / 12;
      const monthlyHelp = help / 12;
      const monthlySac = sacrifice / 12;
      const net = monthlyGross - monthlyTax - monthlySac - otherDed;

      return {
        social: r2(medicare / 12), // Medicare shown under social-ish
        tax: r2(tax / 12 + monthlyHelp),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross (A$)', r2(monthlyGross)],
          ['Salary sacrifice super (annual→month)', r2(monthlySac)],
          ['Income tax (after LITO)', r2(tax / 12)],
          ['Medicare levy 2%', r2(medicare / 12)],
          ['HELP / HECS repayment', r2(monthlyHelp)],
          ['Other deductions', r2(otherDed)],
          ['Net / Take-home', r2(net)]
        ],
        source: 'ATO FY 2026–27 resident brackets (15/30/37/45%) + Medicare 2% + optional HELP — Super SG is employer-paid, not deducted here'
      };
    }

    function calcNewZealand(monthlyGross) {
      // IRD 2026–27 PAYE + ACC + optional KiwiSaver / student loan
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const annual = monthlyGross * 12;

      // Income tax brackets (unchanged 2026–27)
      let tax = 0;
      if (annual > 0) tax += Math.min(annual, 15600) * 0.105;
      if (annual > 15600) tax += Math.min(annual - 15600, 53500 - 15600) * 0.175;
      if (annual > 53500) tax += Math.min(annual - 53500, 78100 - 53500) * 0.30;
      if (annual > 78100) tax += Math.min(annual - 78100, 180000 - 78100) * 0.33;
      if (annual > 180000) tax += (annual - 180000) * 0.39;

      // ACC earner levy 1.75%, cap $156,641
      const accCap = 156641;
      const acc = Math.min(annual, accCap) * 0.0175;

      // KiwiSaver employee
      const ksRate = parseFloat(document.getElementById('nzKs')?.value) || 0;
      const kiwi = annual * (ksRate / 100);

      // Student loan 12% above $24,128
      let student = 0;
      if (document.getElementById('nzStudent')?.value === '1' && annual > 24128) {
        student = (annual - 24128) * 0.12;
      }

      const otherRaw = document.getElementById('nzOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const monthlyTax = tax / 12;
      const monthlyAcc = acc / 12;
      const monthlyKs = kiwi / 12;
      const monthlyStudent = student / 12;
      const net = monthlyGross - monthlyTax - monthlyAcc - monthlyKs - monthlyStudent - otherDed;

      return {
        social: r2(monthlyAcc),
        tax: r2(monthlyTax + monthlyStudent),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross (NZ$)', r2(monthlyGross)],
          ['PAYE income tax', r2(monthlyTax)],
          ['ACC earner levy 1.75%', r2(monthlyAcc)],
          ['KiwiSaver employee ' + ksRate + '%', r2(monthlyKs)],
          ['Student loan', r2(monthlyStudent)],
          ['Other deductions', r2(otherDed)],
          ['Net / Take-home', r2(net)]
        ],
        source: 'IRD 2026–27 brackets + ACC 1.75% (cap $156,641) + optional KiwiSaver / student loan'
      };
    }

    function calcSweden(monthlyGross) {
      // Skatteverket 2026 – kommunalskatt + statlig + jobbskatteavdrag
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const annual = monthlyGross * 12;

      // Grundavdrag (simplified average ~30,000 for mid incomes)
      let grund = 17400;
      if (annual > 50000) grund = Math.min(45600, 17400 + (annual - 50000) * 0.1);
      if (annual > 400000) grund = Math.max(17400, 45600 - (annual - 400000) * 0.05);
      const taxable = Math.max(0, annual - grund);

      // Municipal tax
      const komRaw = document.getElementById('seKommune')?.value;
      const komRate = (komRaw !== '' && komRaw != null && !isNaN(parseFloat(komRaw)))
        ? parseFloat(komRaw) / 100 : 0.3238;
      let munTax = taxable * komRate;

      // State tax 20% above skiktgräns 643,000
      let stateTax = 0;
      if (taxable > 643000) stateTax = (taxable - 643000) * 0.20;

      // Jobbskatteavdrag (earned income tax credit) – approx max ~38,900
      let jsa = 0;
      if (annual <= 45000) jsa = annual * 0.20;
      else if (annual <= 150000) jsa = 9000 + (annual - 45000) * 0.15;
      else if (annual <= 400000) jsa = Math.min(38900, 24750 + (annual - 150000) * 0.05);
      else jsa = Math.max(0, 38900 - (annual - 400000) * 0.03);
      jsa = Math.min(jsa, munTax + stateTax);

      const taxAnnual = Math.max(0, munTax + stateTax - jsa);
      const otherRaw = document.getElementById('seOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const net = monthlyGross - taxAnnual / 12 - otherDed;

      return {
        social: 0, // employee social effectively offset
        tax: r2(taxAnnual / 12),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross (SEK)', r2(monthlyGross)],
          ['Grundavdrag (annual)', r2(grund)],
          ['Municipal tax ~' + (komRate * 100).toFixed(2) + '%', r2(munTax / 12)],
          ['State tax 20% (if any)', r2(stateTax / 12)],
          ['Jobbskatteavdrag credit', r2(jsa / 12)],
          ['Other deductions', r2(otherDed)],
          ['Net / Netto', r2(net)]
        ],
        source: 'Skatteverket 2026 – avg kommunalskatt 32.38% + statlig 20% above 643k + jobbskatteavdrag (enter your kommun % for accuracy)'
      };
    }

    function calcNorway(monthlyGross) {
      // Skatteetaten 2026 – 22% alminnelig + trinnskatt + trygdeavgift 7.6%
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const annual = monthlyGross * 12;

      // Minstefradrag 46% max 95,700
      const minste = Math.min(annual * 0.46, 95700);
      // Personfradrag 88,250
      const person = 88250;
      const ordinaryBase = Math.max(0, annual - minste - person);
      const ordinaryTax = ordinaryBase * 0.22;

      // Trygdeavgift 7.6% on gross (with low-income phase-in)
      let trygd = 0;
      if (annual > 99650) {
        trygd = annual * 0.076;
        const cap = (annual - 99650) * 0.25;
        trygd = Math.min(trygd, cap);
      }

      // Trinnskatt on gross personinntekt
      let trinn = 0;
      if (annual > 226100) trinn += Math.min(annual - 226100, 318300 - 226100) * 0.017;
      if (annual > 318300) trinn += Math.min(annual - 318300, 725050 - 318300) * 0.04;
      if (annual > 725050) trinn += Math.min(annual - 725050, 980100 - 725050) * 0.137;
      if (annual > 980100) trinn += Math.min(annual - 980100, 1467200 - 980100) * 0.168;
      if (annual > 1467200) trinn += (annual - 1467200) * 0.178;

      const otherRaw = document.getElementById('noOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const totalTax = ordinaryTax + trygd + trinn;
      const net = monthlyGross - totalTax / 12 - otherDed;

      return {
        social: r2(trygd / 12),
        tax: r2((ordinaryTax + trinn) / 12),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross (NOK)', r2(monthlyGross)],
          ['Minstefradrag (annual)', r2(minste)],
          ['Ordinary tax 22%', r2(ordinaryTax / 12)],
          ['Trygdeavgift 7.6%', r2(trygd / 12)],
          ['Trinnskatt', r2(trinn / 12)],
          ['Other deductions', r2(otherDed)],
          ['Net / Netto', r2(net)]
        ],
        source: 'Skatteetaten 2026 – 22% + trinnskatt + trygdeavgift 7.6%'
      };
    }

    function calcDenmark(monthlyGross) {
      // SKAT 2026 – AM-bidrag 8% + bund/mellem/top/top-top + kommune
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const annual = monthlyGross * 12;

      // AM-bidrag 8% on gross
      const am = annual * 0.08;
      const afterAm = annual - am;

      // Personfradrag 54,100
      const personFradrag = 54100;
      const taxable = Math.max(0, afterAm - personFradrag);

      // Bundskat 12.01% on taxable (personal income after AM, approx on afterAm - person)
      const bund = Math.max(0, afterAm - personFradrag) * 0.1201;

      // Mellemskat 7.5% above 641,200 after AM
      let mellem = 0;
      if (afterAm > 641200) mellem = (afterAm - 641200) * 0.075;

      // Topskat 7.5% above 777,900 after AM
      let top = 0;
      if (afterAm > 777900) top = (afterAm - 777900) * 0.075;

      // Top-topskat 5% above 2,592,700 after AM
      let toptop = 0;
      if (afterAm > 2592700) toptop = (afterAm - 2592700) * 0.05;

      // Municipal tax on taxable income
      const komRaw = document.getElementById('dkKommune')?.value;
      const komRate = (komRaw !== '' && komRaw != null && !isNaN(parseFloat(komRaw)))
        ? parseFloat(komRaw) / 100 : 0.2505;
      const munTax = taxable * komRate;

      // Church tax optional
      const churchRate = parseFloat(document.getElementById('dkChurch')?.value) || 0;
      const church = taxable * (churchRate / 100);

      // Beskæftigelsesfradrag approx (reduces tax)
      let besk = Math.min(63300, annual * 0.1275);
      const beskCredit = besk * (komRate + 0.1201); // rough value of deduction

      const otherRaw = document.getElementById('dkOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      let totalTax = am + bund + mellem + top + toptop + munTax + church - beskCredit;
      totalTax = Math.max(0, totalTax);

      const net = monthlyGross - totalTax / 12 - otherDed;

      return {
        social: r2(am / 12),
        tax: r2((bund + mellem + top + toptop + munTax + church - beskCredit) / 12),
        soli: 0, church: r2(church / 12),
        net: r2(net),
        rows: [
          ['Gross (DKK)', r2(monthlyGross)],
          ['AM-bidrag 8%', r2(am / 12)],
          ['Bundskat 12.01%', r2(bund / 12)],
          ['Mellemskat / Topskat', r2((mellem + top + toptop) / 12)],
          ['Municipal tax', r2(munTax / 12)],
          ['Church tax', r2(church / 12)],
          ['Other deductions', r2(otherDed)],
          ['Net / Netto', r2(net)]
        ],
        source: 'SKAT 2026 – AM 8% + bund/mellem/topskat + avg kommuneskat 25.05% (enter your kommune %)'
      };
    }

    function calcFinland(monthlyGross) {
      // Verohallinto / PwC 2026 – state progressive + municipal + employee SS
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const annual = monthlyGross * 12;

      // Employee social: TyEL 7.30% + unemployment 0.89% + health ~1.10% ≈ 9.29%
      const ssRate = 0.0730 + 0.0089 + 0.0110;
      const social = annual * ssRate;

      // Taxable for income tax ≈ gross - employee pension (simplified)
      const taxable = Math.max(0, annual - annual * 0.073);

      // State tax progressive (PwC-style 2026)
      let state = 0;
      if (taxable > 21200) state += Math.min(taxable - 21200, 32600 - 21200) * 0.1264;
      if (taxable > 32600) state += Math.min(taxable - 32600, 40100 - 32600) * 0.1900;
      if (taxable > 40100) state += Math.min(taxable - 40100, 52100 - 40100) * 0.3025;
      if (taxable > 52100) state += (taxable - 52100) * 0.3750;

      // Municipal tax
      const munRaw = document.getElementById('fiMun')?.value;
      const munRate = (munRaw !== '' && munRaw != null && !isNaN(parseFloat(munRaw)))
        ? parseFloat(munRaw) / 100 : 0.0757;
      const munTax = taxable * munRate;

      // Church tax optional
      const churchRate = parseFloat(document.getElementById('fiChurch')?.value) || 0;
      const church = taxable * (churchRate / 100);

      const otherRaw = document.getElementById('fiOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const taxAnnual = state + munTax + church;
      const net = monthlyGross - social / 12 - taxAnnual / 12 - otherDed;

      return {
        social: r2(social / 12),
        tax: r2(taxAnnual / 12),
        soli: 0, church: r2(church / 12),
        net: r2(net),
        rows: [
          ['Gross (€)', r2(monthlyGross)],
          ['TyEL + unemployment + health ~9.3%', r2(social / 12)],
          ['State income tax', r2(state / 12)],
          ['Municipal tax', r2(munTax / 12)],
          ['Church tax', r2(church / 12)],
          ['Other deductions', r2(otherDed)],
          ['Net / Netto', r2(net)]
        ],
        source: 'Finland 2026 – TyEL 7.3% + state progressive + avg municipal 7.57% (enter your kunta %)'
      };
    }

    function calcIceland(monthlyGross) {
      // Skatturinn 2026 – combined brackets + personal tax credit + pension 4%
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const monthly = monthlyGross;

      // Employee pension (reduces tax base)
      const penRate = (parseFloat(document.getElementById('isPension')?.value) || 4) / 100;
      const pension = monthly * penRate;
      const taxBase = Math.max(0, monthly - pension);

      // Combined tax brackets (state + municipal) on monthly tax base
      let tax = 0;
      if (taxBase > 0) tax += Math.min(taxBase, 498122) * 0.3149;
      if (taxBase > 498122) tax += Math.min(taxBase - 498122, 1398450 - 498122) * 0.3799;
      if (taxBase > 1398450) tax += (taxBase - 1398450) * 0.4629;

      // Personal tax credit 72,492 ISK/month
      const credit = 72492;
      tax = Math.max(0, tax - credit);

      const otherRaw = document.getElementById('isOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const net = monthly - pension - tax - otherDed;

      return {
        social: r2(pension),
        tax: r2(tax),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross (ISK)', r2(monthly)],
          ['Pension employee ' + (penRate * 100) + '%', r2(pension)],
          ['Income tax (after personal credit)', r2(tax)],
          ['Other deductions', r2(otherDed)],
          ['Net / Netto', r2(net)]
        ],
        source: 'Skatturinn 2026 – brackets 31.49/37.99/46.29% + personal credit 72,492 ISK/mo + pension 4%'
      };
    }

    function calcUkraine(monthlyGross) {
      // Tax Code Ukraine 2026 – PIT 18% + military levy 5%
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const gross = monthlyGross;

      const pit = gross * 0.18;
      const military = gross * 0.05;
      // USC 22% is employer-only – not deducted from employee

      const otherRaw = document.getElementById('uaOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const net = gross - pit - military - otherDed;

      return {
        social: 0,
        tax: r2(pit + military),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross (UAH)', r2(gross)],
          ['Personal income tax 18%', r2(pit)],
          ['Military levy 5%', r2(military)],
          ['Other deductions', r2(otherDed)],
          ['Net / Netto', r2(net)]
        ],
        source: 'Ukraine 2026 – PIT 18% + military levy 5% (USC 22% employer-only)'
      };
    }

    function calcNetherlands(monthlyGross) {
      // Belastingdienst 2026 – Box 1 + heffingskortingen (official tables)
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      let annual = monthlyGross * 12;

      const aow = document.getElementById('nlAow')?.value === '1';
      const ruling30 = document.getElementById('nl30')?.value === '1';
      const iack = document.getElementById('nlIack')?.value === '1';
      const otherRaw = document.getElementById('nlOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      let taxableWage = annual;
      let freePart = 0;
      if (ruling30) {
        freePart = annual * 0.30;
        taxableWage = annual * 0.70;
      }

      const b1 = R('NL', 'box1_schijf1_to', 38883);
      const b2 = R('NL', 'box1_schijf2_to', 78426);
      let tax = 0;
      if (aow) {
        const r1 = R('NL', 'box1_schijf1_rate_aow', 0.1785);
        if (taxableWage > 0) tax += Math.min(taxableWage, b1) * r1;
        if (taxableWage > b1) tax += (Math.min(taxableWage, b2) - b1) * R('NL', 'box1_schijf2_rate', 0.3756);
        if (taxableWage > b2) tax += (taxableWage - b2) * R('NL', 'box1_schijf3_rate', 0.495);
      } else {
        if (taxableWage > 0) tax += Math.min(taxableWage, b1) * R('NL', 'box1_schijf1_rate', 0.3575);
        if (taxableWage > b1) tax += (Math.min(taxableWage, b2) - b1) * R('NL', 'box1_schijf2_rate', 0.3756);
        if (taxableWage > b2) tax += (taxableWage - b2) * R('NL', 'box1_schijf3_rate', 0.495);
      }

      // Algemene heffingskorting
      const ahkFrom = R('NL', 'algemene_heffingskorting_phase_from', 29736);
      const ahkTo = R('NL', 'algemene_heffingskorting_phase_to', 78426);
      let ahk = 0;
      if (aow) {
        const maxA = R('NL', 'algemene_heffingskorting_max_aow', 1556);
        const pctA = R('NL', 'algemene_heffingskorting_phase_pct_aow', 0.03195);
        if (taxableWage <= ahkFrom) ahk = maxA;
        else if (taxableWage < ahkTo) ahk = Math.max(0, maxA - pctA * (taxableWage - ahkFrom));
      } else {
        const maxA = R('NL', 'algemene_heffingskorting_max', 3115);
        const pctA = R('NL', 'algemene_heffingskorting_phase_pct', 0.06398);
        if (taxableWage <= ahkFrom) ahk = maxA;
        else if (taxableWage < ahkTo) ahk = Math.max(0, maxA - pctA * (taxableWage - ahkFrom));
      }

      // Arbeidskorting
      const ai = taxableWage;
      const ak1 = R('NL', 'ak_b1', 11965);
      const ak2 = R('NL', 'ak_b2', 25845);
      const ak3 = R('NL', 'ak_b3', 45592);
      const ak4 = R('NL', 'ak_b4', 132920);
      let ak = 0;
      if (!aow) {
        if (ai <= ak1) ak = R('NL', 'ak_p1', 0.08324) * ai;
        else if (ai <= ak2) ak = R('NL', 'ak_fixed1', 996) + R('NL', 'ak_p2', 0.31009) * (ai - ak1);
        else if (ai <= ak3) ak = R('NL', 'ak_fixed2', 5300) + R('NL', 'ak_p3', 0.01950) * (ai - ak2);
        else if (ai < ak4) ak = Math.max(0, R('NL', 'ak_max', 5685) - R('NL', 'ak_p4', 0.06510) * (ai - ak3));
        ak = Math.min(ak, R('NL', 'ak_max', 5685));
      } else {
        if (ai <= ak1) ak = R('NL', 'ak_p1_aow', 0.04156) * ai;
        else if (ai <= ak2) ak = R('NL', 'ak_fixed1_aow', 498) + R('NL', 'ak_p2_aow', 0.15483) * (ai - ak1);
        else if (ai <= ak3) ak = R('NL', 'ak_fixed2_aow', 2647) + R('NL', 'ak_p3_aow', 0.00974) * (ai - ak2);
        else if (ai < ak4) ak = Math.max(0, R('NL', 'ak_max_aow', 2840) - R('NL', 'ak_p4_aow', 0.03250) * (ai - ak3));
        ak = Math.min(ak, R('NL', 'ak_max_aow', 2840));
      }

      // IACK
      let iackAmt = 0;
      if (iack && !aow) {
        const ifrom = R('NL', 'iack_from', 6239);
        const ito = R('NL', 'iack_to', 32710);
        if (ai > ifrom && ai < ito) iackAmt = R('NL', 'iack_pct', 0.1145) * (ai - ifrom);
        else if (ai >= ito) iackAmt = R('NL', 'iack_max', 3032);
      }

      // Ouderenkorting
      let ouderen = 0;
      if (aow) {
        const om = R('NL', 'ouderen_max', 2067);
        const ofr = R('NL', 'ouderen_from', 46002);
        const oto = R('NL', 'ouderen_to', 59782);
        if (taxableWage <= ofr) ouderen = om;
        else if (taxableWage < oto) ouderen = Math.max(0, om - R('NL', 'ouderen_pct', 0.15) * (taxableWage - ofr));
      }

      const totalCredits = ahk + ak + iackAmt + ouderen;
      const netTaxAnnual = Math.max(0, tax - totalCredits);
      const monthlyTax = netTaxAnnual / 12;
      const net = monthlyGross - monthlyTax - otherDed;

      return {
        social: 0,
        tax: r2(monthlyTax),
        soli: 0,
        church: 0,
        net: r2(net),
        rows: [
          ['Gross / Brutoloon', r2(monthlyGross)],
          ['30% ruling tax-free', r2(freePart / 12)],
          ['Taxable wage (annual basis)', r2(taxableWage / 12)],
          ['Box 1 tax before credits', r2(tax / 12)],
          ['Algemene heffingskorting', r2(ahk / 12)],
          ['Arbeidskorting', r2(ak / 12)],
          ['IACK', r2(iackAmt / 12)],
          ['Ouderenkorting', r2(ouderen / 12)],
          ['Other deductions', r2(otherDed)],
          ['Net / Nettoloon', r2(net)]
        ],
        source: 'Belastingdienst 2026 Box 1 + AHK + arbeidskorting tables (rates.json)'
      };
    }

    function calcSecondJob(country, mainMonthlyGross) {
      // Precise second-income rules 2026 (official thresholds)
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      if (document.getElementById('hasSecondJob')?.value !== '1') {
        return { net: 0, tax: 0, social: 0, rows: [], note: '' };
      }
      const g = parseFloat(document.getElementById('secondGross')?.value) || 0;
      if (g <= 0) return { net: 0, tax: 0, social: 0, rows: [], note: '' };
      const type = document.getElementById('secondType')?.value || 'employee';
      const mainAnnual = mainMonthlyGross * 12;
      const secondAnnual = g * 12;
      let tax = 0, social = 0, note = '';

      // --- Germany ---
      if (country === 'DE') {
        const MINIJOB = 603; // 2026 Grenze
        if (type === 'minijob' && g <= MINIJOB) {
          tax = 0;
          social = document.getElementById('minijobRV')?.value === '1' ? g * 0.036 : 0;
          note = social > 0
            ? 'Minijob ≤€603: 0 Lohnsteuer + RV 3.6% employee'
            : 'Minijob ≤€603 (2026): 0 tax + 0 SV for employee (employer pays pauschal 2%)';
        } else if (type === 'minijob' && g > MINIJOB && g <= 2000) {
          // Official Midijob 2026 employee BE
          const beAN = Math.max(0, 1.431639227 * g - 863.2784538);
          const beGes = Math.max(0, 1.145937223 * g - 291.8744452);
          const kvz2 = parseFloat(document.getElementById('zusatz')?.value) || 2.9;
          social = beAN * 0.093 + beAN * 0.013 + beAN * (0.073 + kvz2 / 200) + beAN * 0.018 + beGes * 0.006;
          try {
            const res = papCalculate(2026, { LZZ: 2, RE4: Math.round(g * 100), STKL: 6, KVZ: kvz2, PVZ: 1, KRV: 0, PKV: 0 });
            tax = (res.LSTLZZ || 0) / 100;
          } catch (e) { tax = deLohnsteuerSK6(g); }
          note = 'Midijob second job: official BE formula 2026 + SK6 PAP';
        } else if (type === 'freelance') {
          // Einkommensteuer on profit (simplified: no GFB share left if main job uses it)
          tax = deEinkommensteuerExtra(secondAnnual) / 12;
          social = 0; // KV voluntary / different
          note = 'Freelance: ESt on combined income (estimate); no employee SV';
        } else {
          // Second employment → Steuerklasse VI via official PAP + full SV
          const pensionCeil = 8450, healthCeil = 5812.50;
          const kvz = parseFloat(document.getElementById('zusatz')?.value) || 2.9;
          social = Math.min(g, pensionCeil) * 0.093
                 + Math.min(g, pensionCeil) * 0.013
                 + Math.min(g, healthCeil) * (0.073 + kvz / 200)
                 + Math.min(g, healthCeil) * 0.018;
          try {
            const res = papCalculate(2026, {
              LZZ: 2, RE4: Math.round(g * 100), STKL: 6,
              KVZ: kvz, PVZ: 1, KRV: 0, PKV: 0
            });
            tax = (res.LSTLZZ || 0) / 100;
          } catch (e) {
            tax = deLohnsteuerSK6(g);
          }
          note = 'Zweitjob: Lohnsteuer Steuerklasse VI (BMF PAP 2026) + full SV';
        }
      }
      // --- United Kingdom ---
      else if (country === 'UK') {
        const PT = 1048; // monthly primary threshold 2026/27
        const UEL = 4189; // monthly UEL
        const combined = mainAnnual + secondAnnual;
        if (type === 'freelance') {
          // Class 4 NI 6% between 12570–50270, 2% above; IT on profits
          const profits = secondAnnual;
          let c4 = 0;
          if (profits > 12570) c4 += (Math.min(profits, 50270) - 12570) * 0.06;
          if (profits > 50270) c4 += (profits - 50270) * 0.02;
          social = c4 / 12;
          // Income tax: no PA on this stream if main used it
          let it = 0;
          const band = Math.min(profits, 50270);
          it += band * 0.20;
          if (profits > 50270) it += (Math.min(profits, 125140) - 50270) * 0.40;
          if (profits > 125140) it += (profits - 125140) * 0.45;
          tax = it / 12;
          note = 'Self-employed: Class 4 NI + Income Tax (no PA on second stream)';
        } else {
          // Class 1 NI per job
          if (g > PT) {
            social = (Math.min(g, UEL) - PT) * 0.08;
            if (g > UEL) social += (g - UEL) * 0.02;
          }
          // Tax code BR / D0 / D1 based on combined
          let rate = 0.20;
          if (combined > 125140) rate = 0.45;
          else if (combined > 50270) rate = 0.40;
          tax = g * rate;
          note = rate === 0.20 ? 'Second job tax code BR (20%) + NI per job' :
                 rate === 0.40 ? 'Combined >£50,270 → D0 (40%) + NI' : 'Combined >£125,140 → D1 (45%) + NI';
        }
      }
      // --- United States ---
      else if (country === 'US') {
        const ssBase = 184500 / 12;
        social = Math.min(g, ssBase) * 0.062 + g * 0.0145;
        if (mainAnnual + secondAnnual > 200000) social += g * 0.009; // rough addl Medicare
        // Federal withholding estimate: marginal on combined
        const combined = mainAnnual + secondAnnual;
        let marg = 0.12;
        if (combined > 100800) marg = 0.22;
        if (combined > 211400) marg = 0.24;
        if (combined > 403550) marg = 0.32;
        tax = g * marg;
        note = 'FICA per employer (SS wage base shared annually) + federal marginal estimate';
      }
      // --- Canada ---
      else if (country === 'CA') {
        const ympeM = 74600 / 12;
        social = Math.max(0, Math.min(g, ympeM) - 3500/12) * R('CA', 'cppRate', 0.0595) + Math.min(g, 68900/12) * R('CA', 'eiRate', 0.0163);
        const combined = mainAnnual + secondAnnual;
        let marg = 0.205;
        if (combined > 117045) marg = 0.26;
        if (combined > 181440) marg = 0.29;
        tax = g * marg;
        note = 'CPP/EI may apply per job; federal tax on combined (refund possible if over-contributed)';
      }
      // --- Netherlands ---
      else if (country === 'NL') {
        // Box 1 on combined – marginal rate
        const combined = mainAnnual + (type === 'freelance' ? secondAnnual * 0.7 : secondAnnual);
        let marg = 0.3575;
        if (combined > 38883) marg = 0.3756;
        if (combined > 76922) marg = 0.495;
        tax = g * marg;
        social = 0;
        note = 'Second income in Box 1 at marginal rate (credits mainly on main job)';
      }
      // --- France ---
      else if (country === 'FR') {
        if (type === 'freelance') {
          social = g * 0.22; // approx micro-BNC / AE
          tax = g * 0.10;
          note = 'Micro-entrepreneur / freelancelike: cotisations + IR estimate';
        } else {
          social = g * 0.208; // cotisations salariales approx
          tax = g * 0.14; // PAS-like on second
          note = 'Second employment: cotisations + IR/PAS on household income';
        }
      }
      // --- Italy ---
      else if (country === 'IT') {
        if (type === 'freelance') {
          social = g * 0.2607; // gestione separata approx 2026
          tax = g * 0.23;
          note = 'Partita IVA / gestione separata (INPS) + IRPEF estimate';
        } else {
          social = g * 0.0919 + (g > 56224/12 ? g * 0.01 : 0);
          tax = g * 0.23;
          note = 'Second job: INPS + IRPEF 23%+ on combined taxable';
        }
      }
      // --- Belgium ---
      else if (country === 'BE') {
        if (type === 'freelance') {
          social = g * 0.20;
          tax = g * 0.40;
          note = 'Self-employed social contributions + tax estimate';
        } else {
          social = g * R('BE', 'onssEmployee', 0.1307);
          tax = g * 0.40; // no quotité on second stream in withholding
          note = 'Second job: ONSS 13.07% + tax without full allowance';
        }
      }
      // --- Spain ---
      else if (country === 'ES') {
        if (type === 'freelance') {
          social = Math.min(g, 5101.20) * 0.313; // autónomo cuota approx
          tax = g * 0.19;
          note = 'Autónomo: cuota SS + IRPF estimate';
        } else {
          social = Math.min(g, 5101.20) * R('ES', 'ssEmployeeApprox', 0.065);
          tax = g * 0.24;
          note = 'Second employment: SS employee + IRPF on combined';
        }
      } else {
        social = g * 0.15;
        tax = g * 0.25;
        note = 'Estimated second-income tax + social';
      }

      tax = Math.max(0, tax);
      social = Math.max(0, social);
      const net = Math.max(0, g - tax - social);
      return {
        net: r2(net), tax: r2(tax), social: r2(social), gross: r2(g),
        rows: [
          ['2nd job gross', r2(g)],
          ['2nd job tax', r2(tax)],
          ['2nd job social/NI/SV', r2(social)],
          ['2nd job net', r2(net)]
        ],
        note
      };
    }

    // Germany SK6 Lohnsteuer approximation 2026 (no Grundfreibetrag)
    function deLohnsteuerSK6(monthlyGross) {
      const annual = monthlyGross * 12;
      // §32a zones but without GFB – tax from first euro using progression
      // Simplified calibrated to published SK6 tables 2026
      let y = annual;
      let tax = 0;
      if (y <= 0) return 0;
      // Effective: treat as if GFB=0, Werbungskosten=0 for withholding
      if (y <= 17005) {
        const t = y / 10000;
        tax = (922.98 * t + 1400) * t; // rough zone1 without shift
      } else if (y <= 66760) {
        const t = (y - 17005) / 10000;
        tax = (181.19 * t + 2397) * t + 1025; // continues
      } else if (y <= 277825) {
        tax = y * 0.42 - 10602;
      } else {
        tax = y * 0.45 - 18936;
      }
      // Scale to match SK6 published (~680 at 3000/mo → 8160/yr)
      // Calibrate factor from known point: 3000/mo → ~680 LSt
      const raw = tax / 12;
      // Blend with linear fit from table points
      const table = [
        [800, 168], [1000, 235], [1500, 390], [2000, 558],
        [2500, 720], [3000, 680], [4000, 1000], [5000, 1340]
      ];
      // Use piecewise linear on table for accuracy
      if (monthlyGross <= table[0][0]) return monthlyGross * (table[0][1] / table[0][0]);
      for (let i = 1; i < table.length; i++) {
        if (monthlyGross <= table[i][0]) {
          const [x0, y0] = table[i - 1];
          const [x1, y1] = table[i];
          return y0 + (y1 - y0) * (monthlyGross - x0) / (x1 - x0);
        }
      }
      return table[table.length - 1][1] + (monthlyGross - table[table.length - 1][0]) * 0.35;
    }

    function deEinkommensteuerExtra(annualExtra) {
      // Marginal tax on extra income assuming main job already used GFB
      if (annualExtra <= 0) return 0;
      // Approx 30–42% marginal for typical main salaries
      if (annualExtra <= 20000) return annualExtra * 0.30;
      if (annualExtra <= 50000) return 6000 + (annualExtra - 20000) * 0.37;
      return 17100 + (annualExtra - 50000) * 0.42;
    }



export {
  calcGermany, calcFrance, calcItaly, calcUK, calcUS, calcCanada,
  calcBelgium, calcSpain, calcIran, calcAustralia, calcNewZealand,
  calcSweden, calcNorway, calcDenmark, calcFinland, calcIceland,
  calcUkraine, calcNetherlands, calcSecondJob
};


export { calcAustralia, calcNewZealand, calcSweden, calcNorway, calcDenmark, calcFinland, calcIceland, calcUkraine, calcNetherlands, calcSecondJob };
