
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

    function calcUK(monthlyGross) {
      // HMRC PAYE 2026/27 – monthly NI + student loan (period method) + Scottish bands
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      // HMRC student loan: floor to whole pounds (payroll spec)
      const floorPound = (n) => Math.floor(Math.max(0, n) + 1e-9);
      const annual = monthlyGross * 12;

      // Pension: fixed £/month overrides %
      const pensionAmtRaw = document.getElementById('ukPensionAmt')?.value;
      const pensionPct = parseFloat(document.getElementById('ukPension')?.value) || 0;
      let monthlyPension = 0;
      if (pensionAmtRaw !== '' && pensionAmtRaw != null && !isNaN(parseFloat(pensionAmtRaw)) && parseFloat(pensionAmtRaw) > 0) {
        monthlyPension = parseFloat(pensionAmtRaw);
      } else {
        monthlyPension = monthlyGross * (pensionPct / 100);
      }
      const pensionAnnual = monthlyPension * 12;
      // Net-pay arrangement: reduces taxable pay and NI-able pay
      const payForTaxAnnual = Math.max(0, annual - pensionAnnual);
      const payForNIMonthly = Math.max(0, monthlyGross - monthlyPension);

      // Personal Allowance
      let pa = R('UK', 'personalAllowance', 12570);
      if (document.getElementById('ukBlind')?.value === '1') pa += R('UK', 'blindAllowance', 3250);
      if (document.getElementById('ukMarriage')?.value === '1') pa += R('UK', 'marriageAllowance', 1260);

      // Tax code override
      const taxCode = (document.getElementById('ukTaxCode')?.value || '').trim().toUpperCase();
      if (taxCode === 'BR') pa = 0;
      else if (taxCode === '0T' || taxCode === 'D0' || taxCode === 'D1') pa = 0;
      else if (/^(\d+)L$/.test(taxCode)) {
        pa = parseInt(taxCode, 10) * 10; // 1257L → 12570
      } else if (/^S(\d+)L$/.test(taxCode)) {
        pa = parseInt(taxCode.slice(1), 10) * 10;
      } else if (/^K(\d+)$/.test(taxCode)) {
        // K codes: negative allowance (add to taxable) – approximate as pa=0 + extra
        pa = 0;
      }

      // PA taper: £1 lost for every £2 over £100k adjusted net income
      const taperFrom = R('UK', 'paTaperFrom', 100000);
      if (payForTaxAnnual > taperFrom) {
        pa = Math.max(0, pa - (payForTaxAnnual - taperFrom) / 2);
      }

      const region = document.getElementById('ukRegion')?.value || 'rUK';
      const taxable = Math.max(0, payForTaxAnnual - pa);
      let tax = 0;

      if (region === 'Scotland') {
        // gov.scot / GOV.UK 2026/27 – slices of income after PA
        const bands = [
          [R('UK', 'scot_starter_to', 3967), R('UK', 'scot_starter_rate', 0.19)],
          [R('UK', 'scot_basic_to', 16956), R('UK', 'scot_basic_rate', 0.20)],
          [R('UK', 'scot_inter_to', 31092), R('UK', 'scot_inter_rate', 0.21)],
          [R('UK', 'scot_higher_to', 62430), R('UK', 'scot_higher_rate', 0.42)],
          [R('UK', 'scot_advanced_to', 112570), R('UK', 'scot_advanced_rate', 0.45)],
          [Infinity, R('UK', 'scot_top_rate', 0.48)]
        ];
        let remaining = taxable, prev = 0;
        for (const [limit, rate] of bands) {
          const slice = Math.min(remaining, limit - prev);
          if (slice > 0) tax += slice * rate;
          remaining -= slice;
          prev = limit;
          if (remaining <= 0) break;
        }
      } else {
        // England / Wales / NI
        if (taxCode === 'BR') {
          tax = taxable * R('UK', 'basicRate', 0.20);
        } else if (taxCode === 'D0') {
          tax = taxable * R('UK', 'higherRate', 0.40);
        } else if (taxCode === 'D1') {
          tax = taxable * R('UK', 'additionalRate', 0.45);
        } else {
          const higherAnnual = R('UK', 'higherThresholdAnnual', 50270);
          const addAnnual = R('UK', 'additionalRateThreshold', 125140);
          const higherStart = Math.max(0, higherAnnual - pa);
          const additionalStart = Math.max(0, addAnnual - pa);
          if (taxable > 0) tax += Math.min(taxable, higherStart) * R('UK', 'basicRate', 0.20);
          if (taxable > higherStart) tax += (Math.min(taxable, additionalStart) - higherStart) * R('UK', 'higherRate', 0.40);
          if (taxable > additionalStart) tax += (taxable - additionalStart) * R('UK', 'additionalRate', 0.45);
        }
      }

      // Employee Class 1 NI – monthly thresholds (HMRC PAYE)
      const spa = document.getElementById('ukSPA')?.value === '1';
      let monthlyNI = 0;
      if (!spa) {
        const PT = R('UK', 'niPT_monthly', 1048);
        const UEL = R('UK', 'niUEL_monthly', 4189);
        if (payForNIMonthly > PT) {
          monthlyNI += (Math.min(payForNIMonthly, UEL) - PT) * R('UK', 'niPrimary', 0.08);
          if (payForNIMonthly > UEL) monthlyNI += (payForNIMonthly - UEL) * R('UK', 'niUpper', 0.02);
        }
      }
      monthlyNI = r2(monthlyNI);

      // Student Loan – HMRC period method: monthly threshold, floor to £
      const studentPlan = document.getElementById('ukStudent')?.value || 'none';
      const slMap = {
        plan1: { m: R('UK', 'studentPlan1_monthly', 2241.66), r: R('UK', 'studentRate', 0.09) },
        plan2: { m: R('UK', 'studentPlan2_monthly', 2448.75), r: R('UK', 'studentRate', 0.09) },
        plan4: { m: R('UK', 'studentPlan4_monthly', 2816.25), r: R('UK', 'studentRate', 0.09) },
        plan5: { m: R('UK', 'studentPlan5_monthly', 2083.33), r: R('UK', 'studentRate', 0.09) },
        pg:    { m: R('UK', 'studentPG_monthly', 1750), r: R('UK', 'studentPGRate', 0.06) }
      };
      let monthlySL = 0;
      if (studentPlan !== 'none' && slMap[studentPlan]) {
        const { m, r } = slMap[studentPlan];
        // Earnings for SL = NI-able earnings (Class 1) in the period
        const e = payForNIMonthly;
        if (e > m) monthlySL = floorPound((e - m) * r);
      }

      const otherRaw = document.getElementById('ukOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const monthlyTax = r2(tax / 12);
      const net = monthlyGross - monthlyTax - monthlyNI - monthlySL - monthlyPension - otherDed;

      const rows = [
        ['Gross pay', r2(monthlyGross)],
        ['Pension (employee)', r2(monthlyPension)],
        ['Personal Allowance (annual)', r2(pa)],
        ['Income Tax (PAYE)', monthlyTax],
        ['National Insurance', monthlyNI]
      ];
      if (monthlySL > 0) rows.push(['Student Loan', r2(monthlySL)]);
      if (otherDed > 0) rows.push(['Other deductions', r2(otherDed)]);
      rows.push(['Net / Take-home', r2(net)]);

      return {
        social: r2(monthlyNI + monthlySL),
        tax: monthlyTax,
        soli: 0,
        church: 0,
        net: r2(net),
        rows,
        source: region === 'Scotland'
          ? 'gov.scot 2026/27 + HMRC NI monthly + Student Loan period method'
          : 'HMRC 2026/27 PAYE + NI PT/UEL monthly + Student Loan (floor £)'
      };
    }

    function calcUS(monthlyGross) {
      // IRS Rev. Proc. 2025-32 + SSA FICA 2026
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      let annual = monthlyGross * 12;
      const filing = document.getElementById('usFiling')?.value || 'single';

      // Pre-tax 401(k): $ amount overrides %
      const k401AmtRaw = document.getElementById('us401kAmt')?.value;
      const k401pct = parseFloat(document.getElementById('us401k')?.value) || 0;
      let k401 = 0;
      if (k401AmtRaw !== '' && k401AmtRaw != null && !isNaN(parseFloat(k401AmtRaw)) && parseFloat(k401AmtRaw) > 0) {
        k401 = parseFloat(k401AmtRaw) * 12;
      } else {
        k401 = annual * (k401pct / 100);
      }

      // HSA pre-tax
      const hsaRaw = document.getElementById('usHsa')?.value;
      const hsa = (hsaRaw !== '' && hsaRaw != null && !isNaN(parseFloat(hsaRaw)))
        ? parseFloat(hsaRaw) * 12 : 0;

      const otherRaw = document.getElementById('usOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      // Federal taxable wages (401k + HSA reduce federal taxable)
      const wagesForTax = Math.max(0, annual - k401 - hsa);

      // Standard deduction 2026
      let stdDed = 16100;
      if (filing === 'mfj') stdDed = 32200;
      else if (filing === 'hoh') stdDed = 24150;

      const ageBlind = parseInt(document.getElementById('usAgeBlind')?.value) || 0;
      if (ageBlind > 0) {
        const per = (filing === 'single' || filing === 'hoh' || filing === 'mfs') ? 2050 : 1650;
        stdDed += per * Math.min(ageBlind, filing === 'mfj' ? 2 : 1);
      }

      const taxable = Math.max(0, wagesForTax - stdDed);

      // Federal brackets 2026
      let brackets;
      if (filing === 'mfj') {
        brackets = [
          [24800, 0.10], [100800, 0.12], [211400, 0.22],
          [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]
        ];
      } else if (filing === 'hoh') {
        brackets = [
          [17700, 0.10], [67450, 0.12], [105700, 0.22],
          [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]
        ];
      } else {
        brackets = [
          [12400, 0.10], [50400, 0.12], [105700, 0.22],
          [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]
        ];
      }

      let federal = 0, prev = 0, remaining = taxable;
      for (const [limit, rate] of brackets) {
        const slice = Math.min(remaining, limit - prev);
        if (slice > 0) federal += slice * rate;
        remaining -= slice;
        prev = limit;
        if (remaining <= 0) break;
      }

      // FICA on gross wages (401k still subject to FICA in traditional plans)
      const ssWageBase = 184500;
      const ss = Math.min(annual, ssWageBase) * R('US', 'ssRate', 0.062);
      const medicare = annual * R('US', 'medicare', 0.0145);
      let addMedicare = 0;
      let addThresh = 200000;
      if (filing === 'mfj') addThresh = 250000;
      else if (filing === 'mfs') addThresh = 125000;
      if (annual > addThresh) addMedicare = (annual - addThresh) * 0.009;
      const fica = ss + medicare + addMedicare;

      // State – user effective rate
      const stateRaw = document.getElementById('usStateRate')?.value;
      const stateRate = (stateRaw !== '' && stateRaw != null && !isNaN(parseFloat(stateRaw)))
        ? parseFloat(stateRaw) / 100 : 0;
      const stateTax = wagesForTax * stateRate;

      const monthlyFederal = federal / 12;
      const monthlyFica = fica / 12;
      const monthlyState = stateTax / 12;
      const monthly401k = k401 / 12;
      const monthlyHsa = hsa / 12;
      const net = monthlyGross - monthlyFederal - monthlyFica - monthlyState - monthly401k - monthlyHsa - otherDed;

      return {
        social: r2(monthlyFica),
        tax: r2(monthlyFederal + monthlyState),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross pay', r2(monthlyGross)],
          ['401(k) pre-tax', r2(monthly401k)],
          ['HSA pre-tax', r2(monthlyHsa)],
          ['Standard deduction (annual)', r2(stdDed)],
          ['Federal income tax', r2(monthlyFederal)],
          ['Social Security 6.2%', r2(ss / 12)],
          ['Medicare 1.45% + addl', r2((medicare + addMedicare) / 12)],
          ['State income tax', r2(monthlyState)],
          ['Other deductions', r2(otherDed)],
          ['Net / Take-home', r2(net)]
        ],
        source: 'IRS 2026 brackets + SSA wage base $184,500 + FICA. Enter state effective % from payslip for accuracy.'
      };
    }

    function calcCanada(monthlyGross) {
      // CRA 2026 federal + CPP/EI + provincial (T4127 formulas)
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      let annual = monthlyGross * 12;

      const rrsp = parseFloat(document.getElementById('caRrsp')?.value) || 0;
      const taxableBase = Math.max(0, annual - rrsp);
      const otherRaw = document.getElementById('caOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      // Federal tax 2026
      const fedBrackets = [
        [58523, 0.14], [117045, 0.205], [181440, 0.26],
        [258482, 0.29], [Infinity, 0.33]
      ];
      let federal = 0, prev = 0, rem = taxableBase;
      for (const [lim, rate] of fedBrackets) {
        const slice = Math.min(rem, lim - prev);
        if (slice > 0) federal += slice * rate;
        rem -= slice; prev = lim;
        if (rem <= 0) break;
      }

      // BPA 2026: $16,452 → $14,829 phase-out $181,440–$258,482
      let bpa = 16452;
      if (taxableBase > 258482) bpa = 14829;
      else if (taxableBase > 181440) {
        bpa = 16452 - (16452 - 14829) * ((taxableBase - 181440) / (258482 - 181440));
      }
      const bpaCredit = bpa * 0.14;
      const ceaCredit = 1501 * 0.14; // Canada Employment Amount
      federal = Math.max(0, federal - bpaCredit - ceaCredit);

      // CPP / QPP + EI 2026
      const prov = document.getElementById('caProvince')?.value || 'ON';
      const isQC = prov === 'QC';
      const ympe = 74600, exemption = 3500, yampe = 85000;
      const pensRate = isQC ? 0.063 : R('CA', 'cppRate', 0.0595);
      const pensMax = isQC ? 4479.30 : 4230.45;
      let cppBase = Math.max(0, Math.min(annual, ympe) - exemption) * pensRate;
      cppBase = Math.min(cppBase, pensMax);
      const cpp2 = annual > ympe ? Math.min((Math.min(annual, yampe) - ympe) * 0.04, 416) : 0;
      const cppTotal = cppBase + cpp2;

      let ei = Math.min(annual, 68900) * (isQC ? 0.0130 : 0.0163);
      if (isQC) ei += Math.min(annual, 103000) * 0.00430; // QPIP approx

      // Provincial tax
      const t = taxableBase;
      let provincial = 0;

      function applyBrackets(brackets, income) {
        let p = 0, pr = 0, rr = income;
        for (const [l, r] of brackets) {
          const s = Math.min(rr, l - pr);
          if (s > 0) p += s * r;
          rr -= s; pr = l;
          if (rr <= 0) break;
        }
        return p;
      }

      if (prov === 'ON') {
        provincial = applyBrackets([
          [53891, 0.0505], [107785, 0.0915], [150000, 0.1116],
          [220000, 0.1216], [Infinity, 0.1316]
        ], t);
        // Ontario surtax: 20% on tax > $5,818; 36% on tax > $7,446
        if (provincial > 7446) {
          provincial += (provincial - 7446) * 0.36 + (7446 - 5818) * 0.20;
        } else if (provincial > 5818) {
          provincial += (provincial - 5818) * 0.20;
        }
        provincial = Math.max(0, provincial - 12989 * 0.0505); // ON BPA credit
      } else if (prov === 'AB') {
        provincial = applyBrackets([
          [61200, 0.08], [154259, 0.10], [185111, 0.12],
          [246813, 0.13], [370220, 0.14], [Infinity, 0.15]
        ], t);
        provincial = Math.max(0, provincial - 22769 * 0.08);
      } else if (prov === 'BC') {
        provincial = applyBrackets([
          [50363, 0.0506], [100728, 0.077], [115648, 0.105],
          [140430, 0.1229], [190405, 0.147], [265545, 0.168], [Infinity, 0.205]
        ], t);
        provincial = Math.max(0, provincial - 13216 * 0.0506);
      } else if (prov === 'MB') {
        provincial = applyBrackets([
          [47000, 0.108], [100000, 0.1275], [Infinity, 0.174]
        ], t);
        provincial = Math.max(0, provincial - 15780 * 0.108); // approx BPA
      } else if (prov === 'SK') {
        provincial = applyBrackets([
          [54532, 0.105], [155805, 0.125], [Infinity, 0.145]
        ], t);
        provincial = Math.max(0, provincial - 20381 * 0.105);
      } else if (prov === 'NS') {
        provincial = applyBrackets([
          [30995, 0.0879], [61991, 0.1495], [97417, 0.1667],
          [157124, 0.175], [Infinity, 0.21]
        ], t);
        provincial = Math.max(0, provincial - 11932 * 0.0879);
      } else if (prov === 'NB') {
        provincial = applyBrackets([
          [52333, 0.094], [104666, 0.14], [193861, 0.16], [Infinity, 0.195]
        ], t);
        provincial = Math.max(0, provincial - 13664 * 0.094);
      } else if (prov === 'QC') {
        // Revenu Québec approximate brackets 2026
        provincial = applyBrackets([
          [53255, 0.14], [106510, 0.19], [129590, 0.24], [Infinity, 0.2575]
        ], t);
        provincial = Math.max(0, provincial - 18571 * 0.14); // approx QC BPA
      } else {
        const rateRaw = document.getElementById('caProvRate')?.value;
        const rate = (rateRaw !== '' && rateRaw != null && !isNaN(parseFloat(rateRaw)))
          ? parseFloat(rateRaw) / 100 : 0.10;
        provincial = t * rate;
      }

      const monthlyFed = federal / 12;
      const monthlyCPP = cppTotal / 12;
      const monthlyEI = ei / 12;
      const monthlyProv = provincial / 12;
      const monthlyRrsp = rrsp / 12;
      const net = monthlyGross - monthlyFed - monthlyCPP - monthlyEI - monthlyProv - monthlyRrsp - otherDed;

      return {
        social: r2(monthlyCPP + monthlyEI),
        tax: r2(monthlyFed + monthlyProv),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Gross', r2(monthlyGross)],
          ['RRSP', r2(monthlyRrsp)],
          ['Federal tax (after BPA+CEA)', r2(monthlyFed)],
          ['Provincial tax', r2(monthlyProv)],
          ['CPP / QPP (+CPP2)', r2(monthlyCPP)],
          ['EI' + (isQC ? ' + QPIP' : ''), r2(monthlyEI)],
          ['Other deductions', r2(otherDed)],
          ['Net / Take-home', r2(net)]
        ],
        source: 'CRA 2026 federal + CPP/EI T4127 + provincial brackets (ON surtax, AB, BC, MB, SK, NS, NB, QC approx)'
      };
    }

    function calcBelgium(monthlyGross) {
      // SPF Finances / ONSS 2026 – employee
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const annual = monthlyGross * 12;

      // ONSS 13.07% — ouvriers on 108% of gross
      const isWorker = document.getElementById('beWorker')?.value === 'worker';
      const onssBase = isWorker ? annual * 1.08 : annual;
      let onss = onssBase * R('BE', 'onssEmployee', 0.1307);

      // Work bonus (werkbonus / bonus à l'emploi) 2026 – reduces personal ONSS
      const S = monthlyGross;
      let bonusB = 0, bonusA = 0;
      if (S <= 2300.62) bonusB = 171.99;
      else if (S <= 2937.93) bonusB = 171.99 - 0.2699 * (S - 2300.62);
      if (S <= 2937.93) bonusA = 127.54;
      else if (S <= 3403.62) bonusA = 127.54 - 0.2739 * (S - 2937.93);
      if (isWorker) {
        bonusA *= 137.74 / 127.54;
        bonusB *= 185.75 / 171.99;
      }
      const workBonus = Math.max(0, bonusA) + Math.max(0, bonusB);
      onss = Math.max(0, onss - workBonus * 12);
      const onssMonthly = onss / 12;

      // Special social security contribution (bijzondere bijdrage) – approx monthly
      // Simplified scale based on net taxable approx; typical €0–€50+/month
      let specialSS = 0;
      const netLike = monthlyGross - onssMonthly;
      if (netLike > 1850 && netLike <= 2100) specialSS = 9.30;
      else if (netLike > 2100 && netLike <= 2340) specialSS = 18.60;
      else if (netLike > 2340 && netLike <= 2600) specialSS = 27.90;
      else if (netLike > 2600 && netLike <= 2900) specialSS = 37.20;
      else if (netLike > 2900) specialSS = Math.min(60, 37.20 + (netLike - 2900) * 0.01);

      // Professional expenses forfait 30% capped €6,070 (2026)
      const fraisPro = Math.min(annual * 0.30, 6070);

      // Taxable for PB
      let taxable = Math.max(0, annual - onss - fraisPro);

      // Tax-free allowance (belastingvrije som) ~€11,180 + children
      const kids = parseInt(document.getElementById('beKids')?.value) || 0;
      let free = 11180;
      if (kids >= 1) free += 2130;
      if (kids >= 2) free += 3000;
      if (kids >= 3) free += 6310;
      if (kids >= 4) free += 7070;
      if (kids > 4) free += (kids - 4) * 7070;

      // Federal brackets 2026
      const brackets = [
        [16720, 0.25], [29510, 0.40], [51070, 0.45], [Infinity, 0.50]
      ];
      let tax = 0, prev = 0, rem = taxable;
      for (const [lim, rate] of brackets) {
        const slice = Math.min(rem, lim - prev);
        if (slice > 0) tax += slice * rate;
        rem -= slice; prev = lim;
        if (rem <= 0) break;
      }
      // Credit for tax-free amount
      let freeTax = 0, prev2 = 0, rem2 = free;
      for (const [lim, rate] of brackets) {
        const slice = Math.min(rem2, lim - prev2);
        if (slice > 0) freeTax += slice * rate;
        rem2 -= slice; prev2 = lim;
        if (rem2 <= 0) break;
      }
      tax = Math.max(0, tax - freeTax);

      // Communal tax % of federal tax
      const comRaw = document.getElementById('beCommuneRate')?.value;
      const comRate = (comRaw !== '' && comRaw != null && !isNaN(parseFloat(comRaw)))
        ? parseFloat(comRaw) / 100 : 0.07;
      const communal = tax * comRate;

      const otherRaw = document.getElementById('beOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const monthlyTax = (tax + communal) / 12;
      const net = monthlyGross - onssMonthly - specialSS - monthlyTax - otherDed;

      const usedUser = comRaw !== '' && comRaw != null;

      return {
        social: r2(onssMonthly + specialSS),
        tax: r2(monthlyTax),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Brut', r2(monthlyGross)],
          ['ONSS 13.07% (after work bonus)', r2(onssMonthly)],
          ['Special SS contribution', r2(specialSS)],
          ['Frais professionnels (annual)', r2(fraisPro)],
          ['Federal tax', r2(tax / 12)],
          ['Communal tax', r2(communal / 12)],
          ['Other deductions', r2(otherDed)],
          ['Netto', r2(net)]
        ],
        source: usedUser
          ? 'SPF Finances 2026 + ONSS 13.07% + work bonus + communal from you'
          : 'SPF Finances 2026 + ONSS 13.07% + work bonus + communal 7% avg'
      };
    }

    function calcSpain(monthlyGross) {
      // Seguridad Social Orden 2026 + IRPF estatal + autonómico
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const pays = document.getElementById('esPays')?.value === '14' ? 14 : 12;
      const annual = monthlyGross * pays;

      // Employee SS 2026
      // Contingencias comunes 4.70% + Desempleo 1.55%/1.60% + FP 0.10% + MEI 0.15%
      const isTemp = document.getElementById('esContract')?.value === 'temp';
      const desempleo = isTemp ? 0.0160 : 0.0155;
      const employeeRate = 0.0470 + desempleo + 0.0010 + 0.0015; // ~6.50% or 6.55%
      const maxBaseMonth = 5101.20;
      const ssBaseAnnual = Math.min(annual, maxBaseMonth * 12);
      const ss = ssBaseAnnual * employeeRate;
      const ssMonthly = ss / pays;

      // Reducción por rendimientos del trabajo (approx art. 20 LIRPF)
      // Simplified: 2,000 base; higher for lower incomes
      let reducTrabajo = 2000;
      const rendNeto = annual - ss;
      if (rendNeto <= 13115) reducTrabajo = 7375;
      else if (rendNeto < 16825) reducTrabajo = 7375 - (rendNeto - 13115) * 1.9863;

      // Mínimo personal y familiar 2026
      const kids = parseInt(document.getElementById('esKids')?.value) || 0;
      let minimo = 5550;
      if (kids >= 1) minimo += 2400;
      if (kids >= 2) minimo += 2700;
      if (kids >= 3) minimo += 4000;
      if (kids > 3) minimo += (kids - 3) * 4500;

      // Base liquidable approx
      let taxable = Math.max(0, annual - ss - reducTrabajo);

      const region = document.getElementById('esRegion')?.value || 'ref';
      let irpf = 0;

      // Helper: progressive tax then credit for mínimo (as in LIRPF)
      function progressive(brackets, base) {
        let t = 0, prev = 0, rem = base;
        for (const [lim, rate] of brackets) {
          const slice = Math.min(rem, lim - prev);
          if (slice > 0) t += slice * rate;
          rem -= slice; prev = lim;
          if (rem <= 0) break;
        }
        return t;
      }

      if (region === 'custom') {
        const rateRaw = document.getElementById('esCustomRate')?.value;
        const rate = (rateRaw !== '' && rateRaw != null && !isNaN(parseFloat(rateRaw)))
          ? parseFloat(rateRaw) / 100 : 0.20;
        irpf = Math.max(0, taxable - minimo) * rate;
      } else {
        // Combined state + regional approximate brackets 2026
        let brackets;
        if (region === 'MAD') {
          // Madrid: lower regional
          brackets = [
            [12450, 0.18], [20200, 0.227], [35200, 0.278],
            [60000, 0.36], [300000, 0.43], [Infinity, 0.45]
          ];
        } else if (region === 'CAT') {
          brackets = [
            [12450, 0.20], [20200, 0.25], [35200, 0.32],
            [60000, 0.40], [120000, 0.46], [Infinity, 0.49]
          ];
        } else if (region === 'VAL') {
          brackets = [
            [12450, 0.195], [20200, 0.24], [35200, 0.30],
            [60000, 0.41], [120000, 0.48], [Infinity, 0.52]
          ];
        } else if (region === 'AND') {
          brackets = [
            [12450, 0.19], [20200, 0.24], [35200, 0.30],
            [60000, 0.37], [300000, 0.45], [Infinity, 0.47]
          ];
        } else {
          // Reference average
          brackets = [
            [12450, 0.19], [20200, 0.24], [35200, 0.30],
            [60000, 0.37], [300000, 0.45], [Infinity, 0.47]
          ];
        }
        const taxFull = progressive(brackets, taxable);
        const taxMin = progressive(brackets, minimo);
        irpf = Math.max(0, taxFull - taxMin);
      }

      const otherRaw = document.getElementById('esOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const monthlyTax = irpf / pays;
      const net = monthlyGross - ssMonthly - monthlyTax - otherDed;

      return {
        social: r2(ssMonthly),
        tax: r2(monthlyTax),
        soli: 0, church: 0,
        net: r2(net),
        rows: [
          ['Bruto (esta nómina)', r2(monthlyGross)],
          ['Estructura', pays === 14 ? '14 pagos' : '12 pagos'],
          ['Seguridad Social empleado', r2(ssMonthly)],
          ['Reducción trabajo (anual)', r2(reducTrabajo)],
          ['Mínimo personal/familiar (anual)', r2(minimo)],
          ['IRPF (este periodo)', r2(monthlyTax)],
          ['Otras deducciones', r2(otherDed)],
          ['Neto (esta nómina)', r2(net)],
          ['Neto anual aprox.', r2(net * pays)]
        ],
        source: region === 'custom'
          ? 'SS Orden 2026 + tu tipo IRPF personalizado'
          : 'SS 2026 (CC 4,70% + desempleo + FP + MEI) + IRPF estatal/autonómico — introduce tipo de nómina real si lo tienes'
      };
    }

    function calcIran(monthlyGross) {
      // مالیات حقوق + بیمه تأمین اجتماعی — بودجه ۱۴۰۴ / ۱۴۰۵
      // مبالغ ورودی: تومان (۱ تومان = ۱۰ ریال)
      const r0 = (n) => Math.round(n);
      const year = document.getElementById('irYear')?.value || '1405';
      const otherRaw = document.getElementById('irOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      // پایه مشمول بیمه (از فیش یا ناخالص؛ سقف حدود ۷ برابر حداقل حقوق)
      const insRaw = document.getElementById('irInsBase')?.value;
      let insBase = (insRaw !== '' && insRaw != null && !isNaN(parseFloat(insRaw)))
        ? parseFloat(insRaw) : monthlyGross;
      // سقف تقریبی مشمول بیمه (۷× حداقل — ۱۴۰۴ حدود ۷۵ میلیون، ۱۴۰۵ بالاتر)
      const ceil = year === '1405' ? 120000000 : 75000000;
      insBase = Math.min(insBase, ceil);

      // سهم بیمه‌شده ۷٪
      const insurance = insBase * 0.07;

      // پایه مشمول مالیات: ناخالص − بیمه سهم کارگر (معاف ماده ۹۱)
      const taxBaseMonthly = Math.max(0, monthlyGross - insurance);
      const taxBaseAnnual = taxBaseMonthly * 12;

      // معافیت و پله‌های مالیات حقوق (سالانه — تومان)
      // ۱۴۰۴: معافیت سالانه ۲۸۸ میلیون تومان (ماهانه ۲۴ میلیون)
      // ۱۴۰۵: معافیت سالانه ۴۸۰ میلیون تومان (ماهانه ۴۰ میلیون)
      let brackets; // [upper annual limit, rate]
      if (year === '1405') {
        brackets = [
          [480000000, 0],      // معاف
          [960000000, 0.10],   // مازاد تا ~۸۰ م ماهانه
          [1200000000, 0.15],
          [1440000000, 0.20],
          [1680000000, 0.25],
          [Infinity, 0.30]
        ];
      } else {
        // ۱۴۰۴ — قانون بودجه
        brackets = [
          [288000000, 0],
          [360000000, 0.10],
          [456000000, 0.15],
          [600000000, 0.20],
          [800000000, 0.25],
          [Infinity, 0.30]
        ];
      }

      let taxAnnual = 0, prev = 0;
      for (const [lim, rate] of brackets) {
        if (taxBaseAnnual <= prev) break;
        const slice = Math.min(taxBaseAnnual, lim) - prev;
        if (slice > 0 && rate > 0) taxAnnual += slice * rate;
        prev = lim;
        if (taxBaseAnnual <= lim) break;
      }
      const taxMonthly = taxAnnual / 12;

      const net = monthlyGross - insurance - taxMonthly - otherDed;

      return {
        social: r0(insurance),
        tax: r0(taxMonthly),
        soli: 0,
        church: 0,
        net: r0(net),
        rows: [
          ['حقوق ناخالص (تومان)', r0(monthlyGross)],
          ['پایه مشمول بیمه', r0(insBase)],
          ['بیمه تأمین اجتماعی سهم کارگر ۷٪', r0(insurance)],
          ['پایه مشمول مالیات (پس از بیمه)', r0(taxBaseMonthly)],
          ['مالیات حقوق (پلکانی)', r0(taxMonthly)],
          ['کسورات دیگر', r0(otherDed)],
          ['حقوق خالص', r0(net)]
        ],
        source: year === '1405'
          ? 'بیمه تأمین اجتماعی ۷٪ + مالیات حقوق بودجه ۱۴۰۵ (معافیت ماهانه ۴۰ میلیون تومان) — مبالغ به تومان'
          : 'بیمه تأمین اجتماعی ۷٪ + مالیات حقوق بودجه ۱۴۰۴ (معافیت ماهانه ۲۴ میلیون تومان) — مبالغ به تومان'
      };
    }




export { calcUK, calcUS, calcCanada, calcBelgium, calcSpain, calcIran };
