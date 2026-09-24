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


function calcGermany(monthlyGross) {
      // BMF PAP 2026 + official SV 2026 incl. Minijob / Midijob
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const taxClass = parseInt(document.getElementById('taxClass').value) || 1;
      const state = document.getElementById('state').value;
      const hasChurch = document.getElementById('church').value === '1';
      const children = parseInt(document.getElementById('children').value) || 0;
      const age = parseInt(document.getElementById('age').value) || 30;
      const zusatz = parseFloat(document.getElementById('zusatz').value);
      const kvz = isNaN(zusatz) ? (R('DE', 'zusatz_default', 0.029) * 100) : zusatz;
      const isSachsen = state === 'SN';
      const zkf = parseFloat(document.getElementById('deZkf')?.value) || 0;
      const freibRaw = document.getElementById('deFreib')?.value;
      const lzzFreib = (freibRaw !== '' && freibRaw != null && !isNaN(parseFloat(freibRaw)))
        ? Math.round(parseFloat(freibRaw) * 100) : 0;
      const pkv = document.getElementById('dePkv')?.value === '1' ? 1 : 0;
      const pkpv = Math.round((parseFloat(document.getElementById('dePkpv')?.value) || 0) * 100);
      const pkpvAg = Math.round((parseFloat(document.getElementById('dePkpvAg')?.value) || 0) * 100);
      const krv = parseInt(document.getElementById('deKrv')?.value) || 0;
      const jobType = document.getElementById('deJobType')?.value || 'regular';
      const optInsRaw = document.getElementById('deOptIns')?.value;
      const optIns = (optInsRaw !== '' && optInsRaw != null && !isNaN(parseFloat(optInsRaw)))
        ? parseFloat(optInsRaw) : 0;
      const freiRaw = document.getElementById('deFreiZuschlag')?.value;
      const freiZuschlag = (freiRaw !== '' && freiRaw != null && !isNaN(parseFloat(freiRaw)))
        ? parseFloat(freiRaw) : 0;
      const nettoAddRaw = document.getElementById('deNettoAdd')?.value;
      const nettoAdd = (nettoAddRaw !== '' && nettoAddRaw != null && !isNaN(parseFloat(nettoAddRaw)))
        ? parseFloat(nettoAddRaw) : 0;

      // Bemessungsgrundlage: Brutto minus steuer-/SV-freie Zuschläge (§3b EStG)
      const svBase = Math.max(0, monthlyGross - freiZuschlag);
      const taxBase = Math.max(0, monthlyGross - freiZuschlag);

      const MINIJOB = R('DE', 'minijob_limit', 603);
      const MIDI_MAX = R('DE', 'midijob_upper', 2000);
      const pensionCeil = R('DE', 'bbg_rv_av_month', 8450);
      const healthCeil = R('DE', 'bbg_kv_pv_month', 5812.50);

      let pension = 0, unemployment = 0, health = 0, care = 0;
      let lst = 0, soli = 0, church = 0;
      let noteExtra = '';

      // ========== MINIJOB ==========
      if (jobType === 'minijob') {
        // Employee: usually 0 Lohnsteuer (pauschal by AG), 0 KV/PV/ALV
        // Optional RV 3.6% if not exempt
        const payRV = document.getElementById('minijobRV')?.value === '1';
        pension = payRV ? r2(monthlyGross * R('DE', 'minijob_rv_employee', 0.036)) : 0;
        unemployment = 0; health = 0; care = 0;
        lst = 0; soli = 0; church = 0;
        noteExtra = payRV
          ? 'Minijob: 0 LSt + RV 3.6% (employee chose not to exempt)'
          : 'Minijob ≤€603: 0 LSt + 0 SV for employee (AG pays pauschal)';
      }
      // ========== MIDIJOB ==========
      else if (jobType === 'midijob') {
        // §20 Abs. 2a SGB IV – Übergangsbereich 2026
        // G = Geringfügigkeitsgrenze, U = upper, F = Faktor F (BMAS)
        const G = MINIJOB;
        const U = MIDI_MAX;
        const F = R('DE', 'faktor_f', 0.6619);
        // BE Gesamt: F*G + (U/(U-G) - G/(U-G)*F) * (AE - G)
        const span = U - G;
        const coeffGes = (U / span) - (G / span) * F;
        const constGes = F * G - coeffGes * G;
        const beGes = Math.max(0, coeffGes * svBase + constGes);
        // BE Arbeitnehmer (reduced employee basis for AN-Anteil)
        // Standard 2026 coeffs when G=603,U=2000,F=0.6619 → 1.431639227*AE - 863.2784538
        const coeffAN = 2 * coeffGes / (1 + F); // derived relation used in payroll software
        // Prefer explicit official short form for 2026 defaults when G/U/F match
        let beAN;
        if (Math.abs(G - 603) < 0.01 && Math.abs(U - 2000) < 0.01 && Math.abs(F - 0.6619) < 0.0001) {
          beAN = Math.max(0, 1.431639227 * svBase - 863.2784538);
        } else {
          // General approximation from F and G for other years
          beAN = Math.max(0, (svBase * (U - F * G) / (U - G) - F * G * (U - svBase) / (U - G)));
        }

        const halfRV = R('DE', 'rv', 0.186) / 2;
        const halfAV = R('DE', 'av', 0.026) / 2;
        const halfKV = R('DE', 'kv_allgemein', 0.146) / 2;
        const pvBase = R('DE', 'pv', 0.036) / 2; // 1.8% employee base
        const pvChildless = R('DE', 'pv_childless_surcharge', 0.006);
        const pvChildDisc = R('DE', 'pv_child_discount', 0.0025);

        if (krv === 0) {
          pension = r2(beAN * halfRV);
          unemployment = r2(beAN * halfAV);
        }
        if (pkv === 0) {
          health = r2(beAN * (halfKV + kvz / 200));
          if (children === 0 && age >= 23) {
            care = r2(beAN * pvBase + beGes * pvChildless);
          } else {
            let careRate = pvBase;
            if (children >= 2) careRate = Math.max(0.008, pvBase - Math.min(children - 1, 4) * pvChildDisc);
            if (isSachsen) careRate += 0.005; // Sachsen: employee pays extra 0.5%
            care = r2(beAN * careRate);
          }
        } else {
          health = Math.max(0, (pkpv - pkpvAg) / 100);
          care = 0;
        }

        try {
          const params = {
            LZZ: 2, RE4: Math.round(taxBase * 100), STKL: taxClass,
            KVZ: kvz, PVZ: (children === 0 && age >= 23) ? 1 : 0,
            PVS: isSachsen ? 1 : 0, PVA: children >= 2 ? Math.min(children - 1, 4) : 0,
            ZKF: zkf, KRV: krv, PKV: pkv, R: hasChurch ? 1 : 0
          };
          if (lzzFreib > 0) params.LZZFREIB = lzzFreib;
          if (pkv === 1 && pkpv > 0) { params.PKPV = pkpv; if (pkpvAg > 0) params.PKPVAGZ = pkpvAg; }
          const res = (window.papCalculate || papCalculate)(2026, params);
          lst = (res.LSTLZZ || 0) / 100;
          soli = (res.SOLZLZZ || 0) / 100;
          const churchBase = (res.BK || res.LSTLZZ || 0) / 100;
          const churchRate = (state === 'BW' || state === 'BY')
            ? R('DE', 'church_bw_by', 0.08) : R('DE', 'church_other', 0.09);
          church = hasChurch ? r2(churchBase * churchRate) : 0;
        } catch (e) { console.error(e); }
        noteExtra = 'Midijob: SV on reduced BE (§20 Abs. 2a SGB IV, F=' + F + ')';
      }
      // ========== REGULAR ==========
      else {
        const halfRV = R('DE', 'rv', 0.186) / 2;
        const halfAV = R('DE', 'av', 0.026) / 2;
        const halfKV = R('DE', 'kv_allgemein', 0.146) / 2;
        const pvBase = R('DE', 'pv', 0.036) / 2;
        const pvChildless = R('DE', 'pv_childless_surcharge', 0.006);
        const pvChildDisc = R('DE', 'pv_child_discount', 0.0025);

        if (krv === 0) {
          pension = r2(Math.min(svBase, pensionCeil) * halfRV);
          unemployment = r2(Math.min(svBase, pensionCeil) * halfAV);
        }
        if (pkv === 0) {
          health = r2(Math.min(svBase, healthCeil) * (halfKV + kvz / 200));
          let careRate = pvBase;
          if (children === 0 && age >= 23) careRate += pvChildless;
          else if (children >= 2) careRate = Math.max(0.008, pvBase - Math.min(children - 1, 4) * pvChildDisc);
          if (isSachsen) careRate += 0.005;
          care = r2(Math.min(svBase, healthCeil) * careRate);
        } else {
          health = Math.max(0, (pkpv - pkpvAg) / 100);
          care = 0;
        }
        try {
          const params = {
            LZZ: 2, RE4: Math.round(taxBase * 100), STKL: taxClass,
            KVZ: kvz, PVZ: (children === 0 && age >= 23) ? 1 : 0,
            PVS: isSachsen ? 1 : 0, PVA: children >= 2 ? Math.min(children - 1, 4) : 0,
            ZKF: zkf, KRV: krv, PKV: pkv, R: hasChurch ? 1 : 0
          };
          if (lzzFreib > 0) params.LZZFREIB = lzzFreib;
          if (pkv === 1 && pkpv > 0) { params.PKPV = pkpv; if (pkpvAg > 0) params.PKPVAGZ = pkpvAg; }
          const res = (window.papCalculate || papCalculate)(2026, params);
          lst = (res.LSTLZZ || 0) / 100;
          soli = (res.SOLZLZZ || 0) / 100;
          const churchBase = (res.BK || res.LSTLZZ || 0) / 100;
          const churchRate = (state === 'BW' || state === 'BY')
            ? R('DE', 'church_bw_by', 0.08) : R('DE', 'church_other', 0.09);
          church = hasChurch ? r2(churchBase * churchRate) : 0;
        } catch (e) { console.error(e); }
        noteExtra = 'Regular: BMF PAP 2026 (lohnsteuerrechner) + SV 2026 GKV/DRV';
      }

      const social = pension + unemployment + health + care;
      const net = monthlyGross - social - lst - soli - church - optIns + nettoAdd;

      return {
        social: r2(social),
        tax: r2(lst),
        soli: r2(soli),
        church: r2(church),
        net: r2(net),
        rows: [
          ['Gross / Brutto', r2(monthlyGross)],
          ['davon steuer-/SV-frei (§3b)', r2(freiZuschlag)],
          ['SV-/Steuer-Bemessung', r2(svBase)],
          ['Rentenversicherung', r2(pension)],
          ['Arbeitslosenversicherung', r2(unemployment)],
          [pkv ? 'PKV (net employee)' : 'Krankenversicherung', r2(health)],
          ['Pflegeversicherung', r2(care)],
          ['Sozialversicherung total', r2(social)],
          ['Lohnsteuer (PAP)', r2(lst)],
          ['Solidaritätszuschlag', r2(soli)],
          ['Kirchensteuer', r2(church)],
          ['Freiwillige Abzüge', r2(optIns)],
          ['AG-Zuschuss / Jobticket', r2(nettoAdd)],
          ['Net / Überweisung', r2(net)]
        ],
        source: noteExtra + ' | Optional: enter Zusatzbeitrag, PKV, ELStAM Freibetrag, voluntary deductions'
      };
    }

    function calcFrance(monthlyGross) {
      // URSSAF/CLEISS 2026 cotisations salariales + barème IR 2026 + décote + QF
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const PMSS = R('FR', 'pass_monthly', 4005);

      const isCadre = document.getElementById('frCadre')?.value === '1';
      const alsace = document.getElementById('frAlsace')?.value === '1';
      const mutuelleRaw = document.getElementById('frMutuelle')?.value;
      const mutuelle = (mutuelleRaw !== '' && mutuelleRaw != null && !isNaN(parseFloat(mutuelleRaw)))
        ? parseFloat(mutuelleRaw) : 0;
      const otherRaw = document.getElementById('frOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const t1 = Math.min(monthlyGross, PMSS);
      const t2 = Math.max(0, Math.min(monthlyGross, PMSS * 8) - PMSS);

      const vieillessePlaf = t1 * R('FR', 'vieillesse_plafonnee_employee', 0.069);
      const vieillesseDeplaf = monthlyGross * R('FR', 'vieillesse_deplafonnee_employee', 0.004);
      const agircT1 = t1 * R('FR', 'agirc_t1_employee', 0.0315);
      const cegT1 = t1 * R('FR', 'ceg_t1_employee', 0.0086);
      const agircT2 = t2 * R('FR', 'agirc_t2_employee', 0.0864);
      const cegT2 = t2 * R('FR', 'ceg_t2_employee', 0.0108);
      const cet = (monthlyGross > PMSS) ? (t1 + t2) * R('FR', 'cet_employee', 0.0014) : 0;
      const apec = isCadre ? Math.min(monthlyGross, PMSS * 4) * R('FR', 'apec_employee', 0.00024) : 0;
      const maladieAM = alsace ? monthlyGross * R('FR', 'maladie_alsace_moselle', 0.013) : 0;

      const assiette = R('FR', 'csg_crds_assiette', 0.9825);
      const csgCap = R('FR', 'csg_plafond_pass', 4) * PMSS * assiette;
      const csgBase = Math.min(monthlyGross * assiette, csgCap);
      const csgDeductible = csgBase * R('FR', 'csg_deductible', 0.068);
      const csgNonDed = csgBase * R('FR', 'csg_non_deductible', 0.024);
      const crds = csgBase * R('FR', 'crds', 0.005);

      const social = vieillessePlaf + vieillesseDeplaf + agircT1 + cegT1 + agircT2 + cegT2
        + cet + apec + maladieAM + csgDeductible + csgNonDed + crds + mutuelle;
      const netAvantImpot = monthlyGross - social - otherDed;

      // Revenu imposable (approx. fiche → déclaration)
      const annualGross = monthlyGross * 12;
      const annualDeductibleSocial = (vieillessePlaf + vieillesseDeplaf + agircT1 + cegT1
        + agircT2 + cegT2 + cet + apec + maladieAM + csgDeductible + mutuelle) * 12;
      let revenuBrutFiscal = annualGross - annualDeductibleSocial;
      const abMin = R('FR', 'abattement10_min', 509);
      const abMax = R('FR', 'abattement10_max', 14555);
      const abattement10 = Math.min(Math.max(revenuBrutFiscal * 0.10, abMin), abMax);
      const revenuImposable = Math.max(0, revenuBrutFiscal - abattement10);

      const situation = document.getElementById('frSituation')?.value || '1';
      const children = parseInt(document.getElementById('frChildren')?.value) || 0;
      let parts = 1;
      if (situation === '2') parts = 2;
      if (children === 1) parts += 0.5;
      else if (children === 2) parts += 1;
      else if (children >= 3) parts += 1 + (children - 2);

      const applyBareme = (qi) => {
        const t1b = R('FR', 'ir_tranche1', 11600);
        const t2b = R('FR', 'ir_tranche2', 29579);
        const t3b = R('FR', 'ir_tranche3', 84577);
        const t4b = R('FR', 'ir_tranche4', 181917);
        let imp = 0;
        if (qi > t1b) imp += (Math.min(qi, t2b) - t1b) * R('FR', 'ir_rate2', 0.11);
        if (qi > t2b) imp += (Math.min(qi, t3b) - t2b) * R('FR', 'ir_rate3', 0.30);
        if (qi > t3b) imp += (Math.min(qi, t4b) - t3b) * R('FR', 'ir_rate4', 0.41);
        if (qi > t4b) imp += (qi - t4b) * R('FR', 'ir_rate5', 0.45);
        return imp;
      };

      const qi = revenuImposable / parts;
      let impotAvecQF = applyBareme(qi) * parts;
      // Plafonnement QF
      if (parts > 1) {
        const baseParts = situation === '2' ? 2 : 1;
        const extraHalfParts = (parts - baseParts) * 2;
        const impotSansQF = applyBareme(revenuImposable / baseParts) * baseParts;
        const avantage = impotSansQF - impotAvecQF;
        const plafond = extraHalfParts * R('FR', 'qf_plafond_demi_part', 1807);
        if (avantage > plafond) impotAvecQF = impotSansQF - plafond;
      }

      // Décote 2026
      let decote = 0;
      const dt = R('FR', 'decote_taux', 0.4525);
      if (parts <= 1.5) {
        if (impotAvecQF < R('FR', 'decote_celib_seuil', 1982))
          decote = Math.max(0, R('FR', 'decote_celib_base', 897) - dt * impotAvecQF);
      } else {
        if (impotAvecQF < R('FR', 'decote_couple_seuil', 3277))
          decote = Math.max(0, R('FR', 'decote_couple_base', 1483) - dt * impotAvecQF);
      }
      const impotNet = Math.max(0, impotAvecQF - decote);

      const pasInput = parseFloat(document.getElementById('frPasRate')?.value);
      let monthlyTax;
      if (!isNaN(pasInput) && pasInput >= 0) {
        monthlyTax = Math.max(0, netAvantImpot) * (pasInput / 100);
      } else {
        monthlyTax = impotNet / 12;
      }

      const net = netAvantImpot - monthlyTax;

      return {
        social: r2(social),
        tax: r2(monthlyTax),
        soli: 0,
        church: 0,
        net: r2(net),
        rows: [
          ['Brut', r2(monthlyGross)],
          ['Vieillesse (plaf. + déplaf.)', r2(vieillessePlaf + vieillesseDeplaf)],
          ['Agirc-Arrco + CEG + CET' + (isCadre ? ' + APEC' : ''), r2(agircT1 + cegT1 + agircT2 + cegT2 + cet + apec)],
          ['CSG + CRDS', r2(csgDeductible + csgNonDed + crds)],
          ['Maladie Alsace-Moselle', r2(maladieAM)],
          ['Mutuelle / prévoyance', r2(mutuelle)],
          ['Autres retenues', r2(otherDed)],
          ['Total cotisations + retenues', r2(social + otherDed)],
          ['Net avant impôt', r2(netAvantImpot)],
          ['IR / PAS', r2(monthlyTax)],
          ['Net à payer', r2(net)]
        ],
        source: 'URSSAF 2026 + barème IR 2026 + décote/QF. Enter PAS from impots.gouv for best monthly net.'
      };
    }

    function calcItaly(monthlyGross) {
      // Agenzia Entrate / INPS 2026 – IRPEF 23/33/43 + detrazioni + addizionali user rates
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const annualGross = monthlyGross * 12;

      // --- INPS IVS dipendente 2026 ---
      // 9.19% fino a massimale; +1% oltre prima fascia pensionabile
      const massimale = 122295;
      const primaFascia = 56224;
      let inpsAnnual = Math.min(annualGross, massimale) * 0.0919;
      if (annualGross > primaFascia) {
        inpsAnnual += (Math.min(annualGross, massimale) - primaFascia) * 0.01;
      }
      const inpsMonthly = inpsAnnual / 12;

      // Reddito imponibile IRPEF
      const taxable = Math.max(0, annualGross - inpsAnnual);

      // --- IRPEF lorda 2026 (L. 199/2025) ---
      let irpefLorda = 0;
      if (taxable > 0) irpefLorda += Math.min(taxable, 28000) * 0.23;
      if (taxable > 28000) irpefLorda += (Math.min(taxable, 50000) - 28000) * 0.33;
      if (taxable > 50000) irpefLorda += (taxable - 50000) * 0.43;

      // --- Detrazione lavoro dipendente (art. 13 TUIR) ---
      let detrLav = 0;
      if (taxable <= 15000) {
        detrLav = 1955; // min garantito 690 indeterminato
      } else if (taxable <= 28000) {
        detrLav = 1910 + 1190 * ((28000 - taxable) / 13000);
      } else if (taxable <= 50000) {
        detrLav = 1910 * ((50000 - taxable) / 22000);
      }
      if (taxable >= 25000 && taxable <= 35000) detrLav += 65;
      detrLav = Math.max(0, detrLav);

      // --- Detrazione coniuge a carico (art. 12) ---
      let detrConiuge = 0;
      const spouse = document.getElementById('itSpouse')?.value === '1';
      if (spouse && taxable < 80000) {
        if (taxable <= 15000) detrConiuge = 800;
        else if (taxable <= 40000) detrConiuge = 690;
        else detrConiuge = 690 * ((80000 - taxable) / 40000);
      }

      // --- Figli: Assegno Unico usually replaces; residual only if user claims ---
      const kids = parseInt(document.getElementById('itKids')?.value) || 0;
      const assegno = document.getElementById('itAssegno')?.value !== '0';
      let detrFigli = 0;
      if (kids > 0 && !assegno && taxable < 95000) {
        const perChild = taxable <= 15000 ? 1220
          : (taxable <= 40000 ? 950 : 950 * Math.max(0, (95000 - taxable) / 55000));
        detrFigli = perChild * kids;
      }

      const totalDetr = detrLav + detrConiuge + detrFigli;
      const irpefNetta = Math.max(0, irpefLorda - totalDetr);

      // --- Trattamento integrativo (ex bonus Renzi) ---
      let trattamento = 0;
      if (taxable <= 15000 && irpefLorda > 0) {
        trattamento = Math.min(1200, Math.max(0, irpefLorda - totalDetr + 1200));
        // Simplification: up to €100/month if capacity
        if (irpefNetta <= 0) trattamento = Math.min(1200, 1200);
        else trattamento = Math.min(1200, 1200);
      }
      // Standard: €1,200/year if reddito <= 15k and IRPEF capacity
      if (taxable <= 15000) {
        trattamento = 1200;
      } else {
        trattamento = 0;
      }

      // --- Addizionali (user rates preferred) ---
      const regRaw = document.getElementById('itRegRate')?.value;
      const comRaw = document.getElementById('itComRate')?.value;
      const regRate = (regRaw !== '' && regRaw != null && !isNaN(parseFloat(regRaw)))
        ? parseFloat(regRaw) / 100 : 0.0173;
      const comRate = (comRaw !== '' && comRaw != null && !isNaN(parseFloat(comRaw)))
        ? parseFloat(comRaw) / 100 : 0.006;
      // Addizionali only if IRPEF due (when detrazioni wipe IRPEF, addizionali often zero)
      const addBase = irpefNetta > 0 ? taxable : 0;
      const addReg = addBase * regRate;
      const addCom = addBase * comRate;

      const otherRaw = document.getElementById('itOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      const annualTax = Math.max(0, irpefNetta + addReg + addCom) - (taxable <= 15000 ? Math.min(trattamento, Math.max(0, irpefNetta + addReg + addCom)) : 0);
      // Trattamento is added to net, not only reducing tax
      const monthlyTax = Math.max(0, irpefNetta + addReg + addCom) / 12;
      const monthlyTrattamento = (taxable <= 15000 ? 100 : 0); // €100/month typical
      const net = monthlyGross - inpsMonthly - monthlyTax + monthlyTrattamento - otherDed;

      const usedUserRates = (regRaw !== '' && regRaw != null && regRaw !== '') ||
        (comRaw !== '' && comRaw != null && comRaw !== '');

      return {
        social: r2(inpsMonthly),
        tax: r2(monthlyTax),
        soli: 0,
        church: 0,
        net: r2(net),
        rows: [
          ['Lordo', r2(monthlyGross)],
          ['INPS c/dipendente', r2(inpsMonthly)],
          ['IRPEF lorda', r2(irpefLorda / 12)],
          ['Detrazione lavoro dipendente', r2(detrLav / 12)],
          ['Detrazione coniuge/figli', r2((detrConiuge + detrFigli) / 12)],
          ['IRPEF netta', r2(irpefNetta / 12)],
          ['Addizionale regionale', r2(addReg / 12)],
          ['Addizionale comunale', r2(addCom / 12)],
          ['Trattamento integrativo', r2(monthlyTrattamento)],
          ['Altre trattenute', r2(otherDed)],
          ['Netto', r2(net)]
        ],
        source: usedUserRates
          ? 'IRPEF 23/33/43 + INPS + detrazioni 2026 + addizionali da CU → massima accuratezza'
          : 'IRPEF+INPS+detrazioni 2026 + addizionali medie (inserisci % dal CU per 100%)'
      };
    }



export { calcGermany, calcFrance, calcItaly };
