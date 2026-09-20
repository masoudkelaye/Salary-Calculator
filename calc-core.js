import { calculate as papCalculate } from "https://cdn.jsdelivr.net/npm/lohnsteuerrechner@1.0.7/+esm";

function calcGermany(monthlyGross) {
      // BMF PAP 2026 + official SV 2026 incl. Minijob / Midijob
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
      const taxClass = parseInt(document.getElementById('taxClass').value) || 1;
      const state = document.getElementById('state').value;
      const hasChurch = document.getElementById('church').value === '1';
      const children = parseInt(document.getElementById('children').value) || 0;
      const age = parseInt(document.getElementById('age').value) || 30;
      const zusatz = parseFloat(document.getElementById('zusatz').value);
      const kvz = isNaN(zusatz) ? 2.9 : zusatz;
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

      const MINIJOB = 603;
      const MIDI_MAX = 2000;
      const pensionCeil = 8450;
      const healthCeil = 5812.50;

      let pension = 0, unemployment = 0, health = 0, care = 0;
      let lst = 0, soli = 0, church = 0;
      let noteExtra = '';

      // ========== MINIJOB ==========
      if (jobType === 'minijob') {
        // Employee: usually 0 Lohnsteuer (pauschal by AG), 0 KV/PV/ALV
        // Optional RV 3.6% if not exempt
        const payRV = document.getElementById('minijobRV')?.value === '1';
        pension = payRV ? monthlyGross * 0.036 : 0;
        unemployment = 0; health = 0; care = 0;
        lst = 0; soli = 0; church = 0;
        noteExtra = payRV
          ? 'Minijob: 0 LSt + RV 3.6% (employee chose not to exempt)'
          : 'Minijob ≤€603: 0 LSt + 0 SV for employee (AG pays pauschal)';
      }
      // ========== MIDIJOB ==========
      else if (jobType === 'midijob') {
        // Official 2026 formulas (DRV / §20 Abs. 2a SGB IV)
        // BE for employee share:
        const beAN = Math.max(0, 1.431639227 * svBase - 863.2784538);
        // BE for total (used for childless PV surcharge):
        const beGes = Math.max(0, 1.145937223 * svBase - 291.8744452);

        if (krv === 0) {
          pension = beAN * 0.093;
          unemployment = beAN * 0.013;
        }
        if (pkv === 0) {
          health = beAN * (0.073 + kvz / 200);
          let careRate = 0.018;
          if (children === 0 && age >= 23) {
            // base on beAN + childless surcharge on beGes
            care = beAN * 0.018 + beGes * 0.006;
          } else {
            if (children >= 2) careRate = Math.max(0.008, 0.018 - Math.min(children - 1, 4) * 0.0025);
            if (isSachsen) careRate += 0.005;
            care = beAN * careRate;
          }
        } else {
          health = Math.max(0, (pkpv - pkpvAg) / 100);
          care = 0;
        }

        // Lohnsteuer: normal PAP with chosen tax class (not automatic SK6)
        try {
          const params = {
            LZZ: 2, RE4: Math.round(taxBase * 100), STKL: taxClass,
            KVZ: kvz, PVZ: (children === 0 && age >= 23) ? 1 : 0,
            PVS: isSachsen ? 1 : 0, PVA: children >= 2 ? Math.min(children - 1, 4) : 0,
            ZKF: zkf, KRV: krv, PKV: pkv, R: hasChurch ? 1 : 0
          };
          if (lzzFreib > 0) params.LZZFREIB = lzzFreib;
          if (pkv === 1 && pkpv > 0) { params.PKPV = pkpv; if (pkpvAg > 0) params.PKPVAGZ = pkpvAg; }
          const res = papCalculate(2026, params);
          lst = (res.LSTLZZ || 0) / 100;
          soli = (res.SOLZLZZ || 0) / 100;
          const churchBase = (res.BK || res.LSTLZZ || 0) / 100;
          const churchRate = (state === 'BW' || state === 'BY') ? 0.08 : 0.09;
          church = hasChurch ? churchBase * churchRate : 0;
        } catch (e) { console.error(e); }
        noteExtra = 'Midijob 2026: SV on reduced BE (official formula F=0.6619)';
      }
      // ========== REGULAR ==========
      else {
        if (krv === 0) {
          pension = Math.min(svBase, pensionCeil) * 0.093;
          unemployment = Math.min(svBase, pensionCeil) * 0.013;
        }
        if (pkv === 0) {
          health = Math.min(svBase, healthCeil) * (0.073 + kvz / 200);
          let careRate = 0.018;
          if (children === 0 && age >= 23) careRate += 0.006;
          else if (children >= 2) careRate = Math.max(0.008, 0.018 - Math.min(children - 1, 4) * 0.0025);
          if (isSachsen) careRate += 0.005;
          care = Math.min(svBase, healthCeil) * careRate;
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
          const res = papCalculate(2026, params);
          lst = (res.LSTLZZ || 0) / 100;
          soli = (res.SOLZLZZ || 0) / 100;
          const churchBase = (res.BK || res.LSTLZZ || 0) / 100;
          const churchRate = (state === 'BW' || state === 'BY') ? 0.08 : 0.09;
          church = hasChurch ? churchBase * churchRate : 0;
        } catch (e) { console.error(e); }
        noteExtra = 'Regular employment: BMF PAP 2026 + full SV';
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
      // Official 2026: URSSAF/CLEISS cotisations + barème IR + décote + plafonnement QF
      const PMSS = 4005; // plafond mensuel SS 2026
      const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

      const isCadre = document.getElementById('frCadre')?.value === '1';
      const mutuelleRaw = document.getElementById('frMutuelle')?.value;
      const mutuelle = (mutuelleRaw !== '' && mutuelleRaw != null && !isNaN(parseFloat(mutuelleRaw)))
        ? parseFloat(mutuelleRaw) : 0;
      const otherRaw = document.getElementById('frOtherDed')?.value;
      const otherDed = (otherRaw !== '' && otherRaw != null && !isNaN(parseFloat(otherRaw)))
        ? parseFloat(otherRaw) : 0;

      // Tranches
      const t1 = Math.min(monthlyGross, PMSS);
      const t2 = Math.max(0, Math.min(monthlyGross, PMSS * 8) - PMSS);

      // Cotisations salariales obligatoires
      const vieillessePlaf = t1 * 0.0690;
      const vieillesseDeplaf = monthlyGross * 0.0040;
      const agircT1 = t1 * 0.0315;
      const cegT1 = t1 * 0.0086;   // CEG salarié T1
      const agircT2 = t2 * 0.0864;
      const cegT2 = t2 * 0.0108;   // CEG salarié T2
      const cet = (monthlyGross > PMSS) ? (t1 + t2) * 0.0014 : 0;
      const apec = isCadre ? Math.min(monthlyGross, PMSS * 4) * 0.00024 : 0;

      // CSG/CRDS sur 98,25 % (abattement 1,75 %, plafonné 4 PMSS)
      const csgBase = Math.min(monthlyGross * 0.9825, 4 * PMSS * 0.9825);
      const csgDeductible = csgBase * 0.0680;
      const csgNonDed = csgBase * 0.0240;
      const crds = csgBase * 0.0050;

      const social = vieillessePlaf + vieillesseDeplaf + agircT1 + cegT1 + agircT2 + cegT2
        + cet + apec + csgDeductible + csgNonDed + crds + mutuelle;
      const netAvantImpot = monthlyGross - social - otherDed;

      // Revenu imposable annuel (approx. fiche de paie → déclaration)
      const annualGross = monthlyGross * 12;
      const annualDeductibleSocial = (vieillessePlaf + vieillesseDeplaf + agircT1 + cegT1
        + agircT2 + cegT2 + cet + apec + csgDeductible + mutuelle) * 12;
      let revenuBrutFiscal = annualGross - annualDeductibleSocial;
      // Abattement forfaitaire 10 % (min 509 €, max 14 555 € 2026)
      const abattement10 = Math.min(Math.max(revenuBrutFiscal * 0.10, 509), 14555);
      let revenuImposable = Math.max(0, revenuBrutFiscal - abattement10);

      const parts = parseFloat(document.getElementById('familyStatus')?.value) || 1;
      const quotient = revenuImposable / parts;

      // Barème IR 2026 (revenus 2025) – service-public
      function taxOnQuotient(q) {
        let t = 0;
        if (q > 11600) t += (Math.min(q, 29579) - 11600) * 0.11;
        if (q > 29579) t += (Math.min(q, 84577) - 29579) * 0.30;
        if (q > 84577) t += (Math.min(q, 181917) - 84577) * 0.41;
        if (q > 181917) t += (q - 181917) * 0.45;
        return t;
      }

      let impotAvecQF = taxOnQuotient(quotient) * parts;

      // Plafonnement du quotient familial : 1 807 € par demi-part supplémentaire
      const baseParts = parts >= 2 ? 2 : 1;
      const extraHalfParts = Math.max(0, (parts - baseParts) * 2);
      if (extraHalfParts > 0) {
        const impotSansQF = taxOnQuotient(revenuImposable / baseParts) * baseParts;
        const avantage = impotSansQF - impotAvecQF;
        const plafond = extraHalfParts * 1807;
        if (avantage > plafond) impotAvecQF = impotSansQF - plafond;
      }

      // Décote 2026
      let decote = 0;
      if (parts <= 1.5) {
        if (impotAvecQF < 1982) decote = Math.max(0, 897 - 0.4525 * impotAvecQF);
      } else {
        if (impotAvecQF < 3277) decote = Math.max(0, 1483 - 0.4525 * impotAvecQF);
      }
      const impotNet = Math.max(0, impotAvecQF - decote);

      // PAS personnel si fourni (prioritaire pour le net mensuel)
      const pasInput = parseFloat(document.getElementById('frPasRate')?.value);
      let monthlyTax;
      if (!isNaN(pasInput) && pasInput >= 0) {
        // Taux PAS appliqué sur une base proche du net imposable mensuel
        // Approximation courante: net avant impôt (hors CSG non déductible déjà dans social)
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
          ['Mutuelle / prévoyance', r2(mutuelle)],
          ['Autres retenues', r2(otherDed)],
          ['Total cotisations + retenues', r2(social + otherDed)],
          ['Net avant impôt', r2(netAvantImpot + otherDed - otherDed)],
          ['IR / PAS', r2(monthlyTax)],
          ['Net à payer', r2(net)]
        ],
        source: 'URSSAF/CLEISS 2026 cotisations + barème IR 2026 + décote + plafonnement QF. Enter PAS rate from impots.gouv for best monthly accuracy.'
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
