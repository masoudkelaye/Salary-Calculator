import { calcGermany, calcFrance, calcItaly } from './calc-core.js';
import { calcUK, calcUS, calcCanada, calcBelgium, calcSpain, calcIran } from './calc-west.js';
import { calcAustralia, calcNewZealand, calcSweden, calcNorway, calcDenmark, calcFinland, calcIceland, calcUkraine, calcNetherlands, calcSecondJob } from './calc-b.js';

const i18n = {
      fa: {
        title: "محاسبه‌گر حقوق خالص اروپا ۲۰۲۶",
        subtitle: "آلمان، فرانسه، ایتالیا، هلند، بلژیک، اسپانیا، انگلیس، آمریکا، کانادا — نرخ‌های رسمی ۲۰۲۶",
        country: "کشور", inputType: "نوع ورودی حقوق", monthly: "ماهانه", weekly: "هفتگی", hourly: "ساعتی",
        monthlyGross: "حقوق ناخالص ماهانه (€)", weeklyGross: "حقوق ناخالص هفتگی (€)", hourlyWage: "حقوق ساعتی (€)", hoursWeek: "ساعات کار در هفته",
        personal: "اطلاعات شخصی و مالیاتی", taxClass: "کلاس مالیاتی (DE)", state: "ایالت / منطقه", church: "عضویت کلیسا؟ (DE)",
        children: "تعداد فرزندان", age: "سن", zusatz: "Zusatzbeitrag GKV % (DE)", status: "وضعیت تأهل / Parts",
        calc: "محاسبه", excel: "دانلود اکسل", update: "بررسی به‌روزرسانی", result: "نتیجه", netLabel: "حقوق خالص ماهانه",
        item: "مورد", monthlyCol: "ماهانه (€)", yearlyCol: "سالانه (€)",
        disclaimer: "<strong>هشدار:</strong> آلمان با PAP رسمی BMF محاسبه می‌شود. فرانسه، ایتالیا و هلند با نرخ‌ها و بازه‌های رسمی ۲۰۲۶ (تقریب خوب برای مقایسه). جزئیات منطقه‌ای، اعتبار مالیاتی و موارد خاص ممکن است نتیجه واقعی را تغییر دهد. جایگزین مشاوره مالیاتی نیست."
      },
      en: {
        title: "EU Net Salary Calculator 2026",
        subtitle: "Germany, France, Italy, Netherlands, Belgium, Spain, UK, USA, Canada — official 2026 rates",
        country: "Country", inputType: "Salary input type", monthly: "Monthly", weekly: "Weekly", hourly: "Hourly",
        monthlyGross: "Monthly gross (€)", weeklyGross: "Weekly gross (€)", hourlyWage: "Hourly wage (€)", hoursWeek: "Hours per week",
        personal: "Personal & tax details", taxClass: "Tax class (DE)", state: "State / Region", church: "Church membership? (DE)",
        children: "Number of children", age: "Age", zusatz: "GKV additional % (DE)", status: "Marital status / Parts",
        calc: "Calculate", excel: "Download Excel", update: "Check updates", result: "Result", netLabel: "Monthly net salary",
        item: "Item", monthlyCol: "Monthly (€)", yearlyCol: "Yearly (€)",
        disclaimer: "<strong>Disclaimer:</strong> Germany uses official BMF PAP. France, Italy and Netherlands use official 2026 rates/brackets (good approximation for comparison). Regional details, tax credits and special cases can change the real result. Not a substitute for tax advice."
      },
      de: {
        title: "EU-Nettogehalt-Rechner 2026",
        subtitle: "Deutschland, Frankreich, Italien, Niederlande, Belgien, Spanien, UK, USA, Kanada — offizielle Sätze 2026",
        country: "Land", inputType: "Eingabeart", monthly: "Monatlich", weekly: "Wöchentlich", hourly: "Stündlich",
        monthlyGross: "Bruttomonatsgehalt (€)", weeklyGross: "Bruttowochengehalt (€)", hourlyWage: "Stundenlohn (€)", hoursWeek: "Wochenstunden",
        personal: "Persönliche Angaben", taxClass: "Steuerklasse (DE)", state: "Bundesland / Region", church: "Kirche? (DE)",
        children: "Anzahl Kinder", age: "Alter", zusatz: "Zusatzbeitrag GKV % (DE)", status: "Familienstand / Parts",
        calc: "Berechnen", excel: "Excel herunterladen", update: "Aktualisierung prüfen", result: "Ergebnis", netLabel: "Monatliches Nettogehalt",
        item: "Position", monthlyCol: "Monatlich (€)", yearlyCol: "Jährlich (€)",
        disclaimer: "<strong>Hinweis:</strong> Deutschland nutzt den offiziellen BMF-PAP. Frankreich, Italien und Niederlande verwenden offizielle 2026-Sätze/Tarife (gute Näherung). Regionale Details und Freibeträge können das Ergebnis ändern. Kein Ersatz für Steuerberatung."
      },
      fr: {
        title: "Calculateur de salaire net UE 2026",
        subtitle: "Allemagne (PAP exact), France, Italie, Pays-Bas — taux officiels 2026",
        country: "Pays", inputType: "Type de saisie", monthly: "Mensuel", weekly: "Hebdomadaire", hourly: "Horaire",
        monthlyGross: "Brut mensuel (€)", weeklyGross: "Brut hebdomadaire (€)", hourlyWage: "Salaire horaire (€)", hoursWeek: "Heures par semaine",
        personal: "Informations personnelles et fiscales", taxClass: "Classe d'impôt (DE)", state: "Land / Région", church: "Appartenance religieuse ? (DE)",
        children: "Nombre d'enfants", age: "Âge", zusatz: "Zusatzbeitrag GKV % (DE)", status: "Situation familiale / Parts",
        calc: "Calculer", excel: "Télécharger Excel", update: "Vérifier les mises à jour", result: "Résultat", netLabel: "Salaire net mensuel",
        item: "Poste", monthlyCol: "Mensuel (€)", yearlyCol: "Annuel (€)",
        disclaimer: "<strong>Avertissement :</strong> L'Allemagne utilise le PAP officiel BMF. La France, l'Italie et les Pays-Bas utilisent les taux et barèmes officiels 2026 (bonne approximation pour comparaison). Les détails régionaux, crédits d'impôt et cas particuliers peuvent modifier le résultat réel. Ne remplace pas un conseil fiscal."
      },
      it: {
        title: "Calcolatore stipendio netto UE 2026",
        subtitle: "Germania (PAP esatto), Francia, Italia, Paesi Bassi — aliquote ufficiali 2026",
        country: "Paese", inputType: "Tipo di input", monthly: "Mensile", weekly: "Settimanale", hourly: "Orario",
        monthlyGross: "Lordo mensile (€)", weeklyGross: "Lordo settimanale (€)", hourlyWage: "Retribuzione oraria (€)", hoursWeek: "Ore a settimana",
        personal: "Dati personali e fiscali", taxClass: "Classe fiscale (DE)", state: "Land / Regione", church: "Appartenenza religiosa? (DE)",
        children: "Numero di figli", age: "Età", zusatz: "Zusatzbeitrag GKV % (DE)", status: "Stato civile / Parti",
        calc: "Calcola", excel: "Scarica Excel", update: "Controlla aggiornamenti", result: "Risultato", netLabel: "Stipendio netto mensile",
        item: "Voce", monthlyCol: "Mensile (€)", yearlyCol: "Annuale (€)",
        disclaimer: "<strong>Avvertenza:</strong> La Germania usa il PAP ufficiale BMF. Francia, Italia e Paesi Bassi usano aliquote e scaglioni ufficiali 2026 (buona approssimazione per confronto). Dettagli regionali, detrazioni e casi particolari possono modificare il risultato reale. Non sostituisce una consulenza fiscale."
      },
      nl: {
        title: "EU Netto Salaris Calculator 2026",
        subtitle: "Duitsland (exacte PAP), Frankrijk, Italië, Nederland — officiële tarieven 2026",
        country: "Land", inputType: "Invoertype", monthly: "Maandelijks", weekly: "Wekelijks", hourly: "Uurloon",
        monthlyGross: "Bruto maandsalaris (€)", weeklyGross: "Bruto weeksalaris (€)", hourlyWage: "Uurloon (€)", hoursWeek: "Uren per week",
        personal: "Persoonlijke & fiscale gegevens", taxClass: "Belastingklasse (DE)", state: "Bundesland / Regio", church: "Kerkelijke bijdrage? (DE)",
        children: "Aantal kinderen", age: "Leeftijd", zusatz: "Zusatzbeitrag GKV % (DE)", status: "Burgerlijke staat / Parts",
        calc: "Berekenen", excel: "Excel downloaden", update: "Updates controleren", result: "Resultaat", netLabel: "Netto maandsalaris",
        item: "Post", monthlyCol: "Maandelijks (€)", yearlyCol: "Jaarlijks (€)",
        disclaimer: "<strong>Disclaimer:</strong> Duitsland gebruikt de officiële BMF-PAP. Frankrijk, Italië en Nederland gebruiken officiële 2026-tarieven/schijven (goede benadering voor vergelijking). Regionale details, heffingskortingen en bijzondere gevallen kunnen het werkelijke resultaat wijzigen. Geen vervanging voor fiscaal advies."
      },
      es: {
        title: "Calculadora de salario neto UE 2026",
        subtitle: "Alemania, Francia, Italia, Países Bajos, Bélgica, España, Reino Unido, EE.UU., Canadá — tarifas oficiales 2026",
        country: "País", inputType: "Tipo de entrada", monthly: "Mensual", weekly: "Semanal", hourly: "Por hora",
        monthlyGross: "Bruto mensual (€)", weeklyGross: "Bruto semanal (€)", hourlyWage: "Salario por hora (€)", hoursWeek: "Horas por semana",
        personal: "Datos personales e impuestos", taxClass: "Clase fiscal (DE)", state: "Estado / Región", church: "¿Iglesia? (DE)",
        children: "Número de hijos", age: "Edad", zusatz: "GKV adicional % (DE)", status: "Estado civil / Parts",
        calc: "Calcular", excel: "Descargar Excel", update: "Comprobar actualizaciones", result: "Resultado", netLabel: "Salario neto mensual",
        item: "Concepto", monthlyCol: "Mensual (€)", yearlyCol: "Anual (€)",
        disclaimer: "<strong>Aviso:</strong> Alemania usa el PAP oficial del BMF. Otros países usan tarifas/tablas oficiales 2026. Detalles regionales y créditos fiscales pueden cambiar el resultado real. No sustituye el asesoramiento fiscal."
      },
    };

    let currentLang = 'fa';

    const CURRENCY = {
      DE: { code: 'EUR', symbol: '€', locale: 'de-DE' },
      FR: { code: 'EUR', symbol: '€', locale: 'fr-FR' },
      IT: { code: 'EUR', symbol: '€', locale: 'it-IT' },
      NL: { code: 'EUR', symbol: '€', locale: 'nl-NL' },
      BE: { code: 'EUR', symbol: '€', locale: 'nl-BE' },
      ES: { code: 'EUR', symbol: '€', locale: 'es-ES' },
      UK: { code: 'GBP', symbol: '£', locale: 'en-GB' },
      US: { code: 'USD', symbol: '$', locale: 'en-US' },
      CA: { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
      IR: { code: 'IRR', symbol: 'تومان', locale: 'fa-IR' },
      AU: { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
      NZ: { code: 'NZD', symbol: 'NZ$', locale: 'en-NZ' },
      SE: { code: 'SEK', symbol: 'kr', locale: 'sv-SE' },
      NO: { code: 'NOK', symbol: 'kr', locale: 'nb-NO' },
      DK: { code: 'DKK', symbol: 'kr', locale: 'da-DK' },
      FI: { code: 'EUR', symbol: '€', locale: 'fi-FI' },
      IS: { code: 'ISK', symbol: 'kr', locale: 'is-IS' },
      UA: { code: 'UAH', symbol: '₴', locale: 'uk-UA' }
    };

    function getCurrency() {
      const c = document.getElementById('country')?.value || 'DE';
      return CURRENCY[c] || CURRENCY.DE;
    }

    function fmtMoney(n, digits = 2) {
      const cur = getCurrency();
      const c = document.getElementById('country')?.value || 'DE';
      if (c === 'IR') {
        // User enters amounts in تومان; show with تومان
        return Number(n).toLocaleString('fa-IR', { maximumFractionDigits: 0 }) + ' تومان';
      }
      try {
        return Number(n).toLocaleString(cur.locale, {
          style: 'currency', currency: cur.code,
          minimumFractionDigits: digits, maximumFractionDigits: digits
        });
      } catch (e) {
        return cur.symbol + Number(n).toFixed(digits);
      }
    }


    window.setLang = function(lang) {
      if (!i18n[lang]) lang = 'en';
      currentLang = lang;
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
      const sel = document.getElementById('langSelect');
      if (sel && sel.value !== lang) sel.value = lang;
      const t = i18n[lang];
      const ids = ['title','subtitle','country','inputType','monthly','weekly','hourly','monthlyGross','weeklyGross','hourlyWage','hoursWeek','personal','taxClass','state','church','children','age','zusatz','status','calc','excel','update','result','netLabel','item','monthlyCol','yearlyCol'];
      ids.forEach(k => { const el = document.getElementById('t-' + k); if (el && t[k]) el.textContent = t[k]; });
      const disc = document.getElementById('t-disclaimer');
      if (disc && t.disclaimer) disc.innerHTML = t.disclaimer;
      const langLab = document.getElementById('t-langLabel');
      if (langLab) {
        langLab.textContent = ({ fa: 'زبان', en: 'Language', de: 'Sprache', fr: 'Langue', it: 'Lingua', nl: 'Taal', es: 'Idioma' })[lang] || 'Language';
      }
      try { localStorage.setItem('netSalaryLang', lang); } catch (e) {}
      onCountryChange();
    };

    function toggleBox(id, show) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', !show);
    }

    function onCountryChange() {
      const countryEl = document.getElementById('country');
      if (!countryEl) return;
      const c = countryEl.value;

      // Germany
      toggleBox('taxClassBox', c === 'DE');
      toggleBox('stateBox', c === 'DE');
      toggleBox('churchBox', c === 'DE');
      toggleBox('zusatzBox', c === 'DE');
      toggleBox('deZkfBox', c === 'DE');
      toggleBox('deFreibBox', c === 'DE');
      toggleBox('dePkvBox', c === 'DE');
      toggleBox('deKrvBox', c === 'DE');
      toggleBox('deJobTypeBox', c === 'DE');
      toggleBox('deOptInsBox', c === 'DE');
      toggleBox('deFreiBox', c === 'DE');
      toggleBox('deNettoAddBox', c === 'DE');
      if (c !== 'DE') toggleBox('dePkpvRow', false);

      // France / Italy
      toggleBox('statusBox', c === 'FR' || c === 'IT');
      toggleBox('frPasBox', c === 'FR');
      toggleBox('frCadreBox', c === 'FR');
      toggleBox('frMutuelleBox', c === 'FR');
      toggleBox('frOtherBox', c === 'FR');
      toggleBox('itRegionBox', c === 'IT');
      toggleBox('itComBox', c === 'IT');
      toggleBox('itKidsBox', c === 'IT');
      toggleBox('itSpouseBox', c === 'IT');
      toggleBox('itOtherBox', c === 'IT');
      toggleBox('itAssegnoBox', c === 'IT');

      // UK
      toggleBox('ukRegionBox', c === 'UK');
      toggleBox('ukStudentBox', c === 'UK');
      toggleBox('ukPensionBox', c === 'UK');
      toggleBox('ukBlindBox', c === 'UK');
      toggleBox('ukMarriageBox', c === 'UK');
      toggleBox('ukSPABox', c === 'UK');
      toggleBox('ukPensionAmtBox', c === 'UK');
      toggleBox('ukOtherBox', c === 'UK');
      toggleBox('ukTaxCodeBox', c === 'UK');

      // US
      toggleBox('usFilingBox', c === 'US');
      toggleBox('usStateBox', c === 'US');
      toggleBox('usAgeBox', c === 'US');
      toggleBox('us401kBox', c === 'US');
      toggleBox('usHsaBox', c === 'US');
      toggleBox('usOtherBox', c === 'US');

      // Canada
      toggleBox('caProvinceBox', c === 'CA');
      toggleBox('caProvRateBox', c === 'CA');
      toggleBox('caRrspBox', c === 'CA');
      toggleBox('caOtherBox', c === 'CA');

      // Netherlands
      toggleBox('nlAowBox', c === 'NL');
      toggleBox('nl30Box', c === 'NL');
      toggleBox('nlIackBox', c === 'NL');
      toggleBox('nlOtherBox', c === 'NL');

      // Belgium / Spain
      toggleBox('beWorkerBox', c === 'BE');
      toggleBox('beCommuneBox', c === 'BE');
      toggleBox('beKidsBox', c === 'BE');
      toggleBox('beOtherBox', c === 'BE');
      toggleBox('esPaysBox', c === 'ES');
      toggleBox('esRegionBox', c === 'ES');
      toggleBox('esCustomBox', c === 'ES');
      toggleBox('esKidsBox', c === 'ES');
      toggleBox('esContractBox', c === 'ES');
      toggleBox('esOtherBox', c === 'ES');

      // Iran
      toggleBox('irYearBox', c === 'IR');
      toggleBox('irMaritalBox', c === 'IR');
      toggleBox('irKidsBox', c === 'IR');
      toggleBox('irInsBaseBox', c === 'IR');
      toggleBox('irOtherBox', c === 'IR');

      // AU / NZ / Scandinavia / FI / IS / UA
      toggleBox('auHelpBox', c === 'AU');
      toggleBox('auSacrificeBox', c === 'AU');
      toggleBox('auOtherBox', c === 'AU');
      toggleBox('nzKsBox', c === 'NZ');
      toggleBox('nzStudentBox', c === 'NZ');
      toggleBox('nzOtherBox', c === 'NZ');
      toggleBox('seKommuneBox', c === 'SE');
      toggleBox('seOtherBox', c === 'SE');
      toggleBox('noOtherBox', c === 'NO');
      toggleBox('dkKommuneBox', c === 'DK');
      toggleBox('dkChurchBox', c === 'DK');
      toggleBox('dkOtherBox', c === 'DK');
      toggleBox('fiMunBox', c === 'FI');
      toggleBox('fiChurchBox', c === 'FI');
      toggleBox('fiOtherBox', c === 'FI');
      toggleBox('isPensionBox', c === 'IS');
      toggleBox('isOtherBox', c === 'IS');
      toggleBox('uaOtherBox', c === 'UA');

      const notes = {
        DE: currentLang==='fa' ? 'آلمان: PAP رسمی BMF + SV ۲۰۲۶ — دقیق' : currentLang==='de' ? 'DE: Offizielle PAP + SV 2026' : 'DE: Official PAP + 2026 social rates',
        FR: currentLang==='fa' ? 'فرانسه: cotisations رسمی + IR — PAS شخصی را وارد کنید' : 'FR: Official cotisations + IR — enter personal PAS',
        IT: currentLang==='fa' ? 'ایتالیا: INPS+IRPEF — نرخ addizionale منطقه/شهر را وارد کنید' : 'IT: INPS+IRPEF — enter regional/municipal rates',
        NL: currentLang==='fa' ? 'هلند: Box 1 + heffingskortingen رسمی ۲۰۲۶' : 'NL: Box 1 + official 2026 tax credits',
        UK: currentLang==='fa' ? 'انگلیس: HMRC ۲۰۲۶/۲۷ + NI + Student Loan — پوند (£)' : 'UK: HMRC 2026/27 + NI + Student Loan (£)',
        US: currentLang==='fa' ? 'آمریکا: IRS ۲۰۲۶ + FICA — دلار ($)' : 'US: IRS 2026 + FICA ($)',
        CA: currentLang==='fa' ? 'کانادا: CRA ۲۰۲۶ + CPP/EI — دلار کانادا (C$)' : 'CA: CRA 2026 + CPP/EI (C$)',
        BE: currentLang==='fa' ? 'بلژیک: ONSS ۱۳٫۰۷٪ + فدرال (€)' : 'BE: ONSS 13.07% + federal (€)',
        ES: currentLang==='fa' ? 'اسپانیا: SS ۶٫۵٪ + IRPF (€)' : 'ES: SS 6.5% + IRPF (€)',
        IR: currentLang==='fa' ? 'ایران: بیمه ۷٪ + مالیات پلکانی — مبالغ به تومان' : 'Iran: SSO 7% + progressive tax — amounts in Toman',
        AU: currentLang==='fa' ? 'استرالیا: ATO + Medicare ۲٪ (A$)' : 'Australia: ATO + Medicare 2% (A$)',
        NZ: currentLang==='fa' ? 'نیوزلند: IRD + ACC + KiwiSaver (NZ$)' : 'New Zealand: IRD + ACC + KiwiSaver (NZ$)',
        SE: currentLang==='fa' ? 'سوئد: kommunalskatt + statlig (SEK)' : 'Sweden: municipal + state (SEK)',
        NO: currentLang==='fa' ? 'نروژ: ۲۲٪ + trinnskatt (NOK)' : 'Norway: 22% + trinnskatt (NOK)',
        DK: currentLang==='fa' ? 'دانمارک: AM ۸٪ + topskat (DKK)' : 'Denmark: AM 8% + topskat (DKK)',
        FI: currentLang==='fa' ? 'فنلاند: state + municipal + TyEL (€)' : 'Finland: state + municipal + TyEL (€)',
        IS: currentLang==='fa' ? 'ایسلند: brackets + pension (ISK)' : 'Iceland: brackets + pension (ISK)',
        UA: currentLang==='fa' ? 'اوکراین: PIT ۱۸٪ + military ۵٪ (₴)' : 'Ukraine: PIT 18% + military 5% (₴)'
      };

      // Currency unit on gross salary labels
      const cur = getCurrency();
      const unitLabels = {
        IR: currentLang==='fa' ? 'تومان' : 'Toman',
        UK: '£', US: '$', CA: 'C$', AU: 'A$', NZ: 'NZ$',
        SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK', UA: '₴',
        DE: '€', FR: '€', IT: '€', NL: '€', BE: '€', ES: '€', FI: '€'
      };
      const unit = unitLabels[c] || cur.symbol || '€';
      const baseMonthly = { fa: 'حقوق ناخالص ماهانه', en: 'Monthly gross', de: 'Bruttomonatsgehalt', fr: 'Brut mensuel', it: 'Lordo mensile', nl: 'Bruto maandsalaris', es: 'Bruto mensual' };
      const baseWeekly = { fa: 'حقوق ناخالص هفتگی', en: 'Weekly gross', de: 'Bruttowochengehalt', fr: 'Brut hebdomadaire', it: 'Lordo settimanale', nl: 'Bruto weeksalaris', es: 'Bruto semanal' };
      const baseHourly = { fa: 'حقوق ساعتی', en: 'Hourly wage', de: 'Stundenlohn', fr: 'Salaire horaire', it: 'Retribuzione oraria', nl: 'Uurloon', es: 'Salario por hora' };
      const mg = document.getElementById('t-monthlyGross');
      const wg = document.getElementById('t-weeklyGross');
      const hw = document.getElementById('t-hourlyWage');
      if (mg) mg.textContent = (baseMonthly[currentLang] || baseMonthly.en) + ' (' + unit + ')';
      if (wg) wg.textContent = (baseWeekly[currentLang] || baseWeekly.en) + ' (' + unit + ')';
      if (hw) hw.textContent = (baseHourly[currentLang] || baseHourly.en) + ' (' + unit + ')';

      const note = document.getElementById('countryNote');
      if (note) note.textContent = notes[c] || '';
    }

    window.onCountryChange = onCountryChange;

    function toggleInput() {
      const type = document.querySelector('input[name="inputType"]:checked').value;
      document.getElementById('monthlyBox').classList.toggle('hidden', type !== 'monthly');
      document.getElementById('weeklyBox').classList.toggle('hidden', type !== 'weekly');
      document.getElementById('hourlyBox').classList.toggle('hidden', type !== 'hourly');
    }
    window.toggleInput = toggleInput;

    function getMonthlyGross() {
      const type = document.querySelector('input[name="inputType"]:checked').value;
      if (type === 'monthly') return parseFloat(document.getElementById('monthlyGross').value) || 0;
      if (type === 'weekly') return (parseFloat(document.getElementById('weeklyGross').value) || 0) * 52 / 12;
      const h = parseFloat(document.getElementById('hourlyWage').value) || 0;
      const hours = parseFloat(document.getElementById('hoursPerWeek').value) || 40;
      return h * hours * 52 / 12;
    }

    // ---------- Country calculators ----------
    
window.calculate = function() {
      const monthlyGross = getMonthlyGross();
      if (monthlyGross <= 0) {
        alert(currentLang === 'fa' ? 'لطفاً مقدار حقوق را وارد کنید' : currentLang === 'de' ? 'Bitte Gehalt eingeben' : 'Please enter salary');
        return;
      }
      const country = document.getElementById('country').value;
      let result;
      if (country === 'DE') result = calcGermany(monthlyGross);
      else if (country === 'FR') result = calcFrance(monthlyGross);
      else if (country === 'IT') result = calcItaly(monthlyGross);
      else if (country === 'NL') result = calcNetherlands(monthlyGross);
      else if (country === 'UK') result = calcUK(monthlyGross);
      else if (country === 'US') result = calcUS(monthlyGross);
      else if (country === 'CA') result = calcCanada(monthlyGross);
      else if (country === 'BE') result = calcBelgium(monthlyGross);
      else if (country === 'ES') result = calcSpain(monthlyGross);
      else if (country === 'IR') result = calcIran(monthlyGross);
      else if (country === 'AU') result = calcAustralia(monthlyGross);
      else if (country === 'NZ') result = calcNewZealand(monthlyGross);
      else if (country === 'SE') result = calcSweden(monthlyGross);
      else if (country === 'NO') result = calcNorway(monthlyGross);
      else if (country === 'DK') result = calcDenmark(monthlyGross);
      else if (country === 'FI') result = calcFinland(monthlyGross);
      else if (country === 'IS') result = calcIceland(monthlyGross);
      else if (country === 'UA') result = calcUkraine(monthlyGross);
      else result = calcNetherlands(monthlyGross);

      document.getElementById('results').classList.remove('hidden');
      const loc = currentLang === 'fa' ? 'fa-IR' : currentLang === 'de' ? 'de-DE' : 'en-US';
      // Second job
      const second = calcSecondJob(country, monthlyGross);
      if (second.net > 0) {
        result.net = Math.round((result.net + second.net + Number.EPSILON) * 100) / 100;
        result.tax = Math.round(((result.tax || 0) + second.tax + Number.EPSILON) * 100) / 100;
        result.social = Math.round(((result.social || 0) + second.social + Number.EPSILON) * 100) / 100;
        result.rows = result.rows.concat(second.rows);
        result.source = (result.source || '') + ' | ' + second.note;
      }

      const cur = getCurrency();
      document.getElementById('netMonthly').textContent = fmtMoney(result.net);
      const yearlyPrefix = currentLang==='fa'?'سالانه: ':currentLang==='de'?'Jährlich: ':currentLang==='es'?'Anual: ':currentLang==='fr'?'Annuel: ':currentLang==='it'?'Annuale: ':currentLang==='nl'?'Jaarlijks: ':'Yearly: ';
      document.getElementById('netYearly').textContent = yearlyPrefix + fmtMoney(result.net * 12, 0);
      // Update table headers with currency
      const sym = cur.symbol;
      const mCol = document.getElementById('t-monthlyCol');
      const yCol = document.getElementById('t-yearlyCol');
      if (mCol) mCol.textContent = (currentLang==='fa'?'ماهانه':currentLang==='de'?'Monatlich':currentLang==='es'?'Mensual':currentLang==='fr'?'Mensuel':currentLang==='it'?'Mensile':currentLang==='nl'?'Maandelijks':'Monthly') + ' (' + sym + ')';
      if (yCol) yCol.textContent = (currentLang==='fa'?'سالانه':currentLang==='de'?'Jährlich':currentLang==='es'?'Anual':currentLang==='fr'?'Annuel':currentLang==='it'?'Annuale':currentLang==='nl'?'Jaarlijks':'Yearly') + ' (' + sym + ')';
      document.getElementById('taxSource').textContent = result.source;

      const tbody = document.getElementById('breakdown');
      tbody.innerHTML = result.rows.map(([name, val]) =>
        `<tr><td>${name}</td><td>${fmtMoney(val)}</td><td>${fmtMoney(val*12, 0)}</td></tr>`
      ).join('');

      window.lastResult = { country, monthlyGross, ...result, annualNet: result.net * 12 };
    };

    window.exportExcel = function() {
      if (!window.lastResult) { alert(currentLang==='fa'?'ابتدا محاسبه کنید':currentLang==='de'?'Bitte zuerst berechnen':'Please calculate first'); return; }
      const r = window.lastResult;
      const data = [['EU Net Salary 2026'], ['Country', r.country], ['Currency', (CURRENCY[r.country]||CURRENCY.DE).code], ['Monthly Gross', r.monthlyGross], ['Monthly Net', r.net], ['Yearly Net', r.annualNet], [], ['Source', r.source]];
      r.rows.forEach(([n,v]) => data.push([n, v]));
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Netto');
      XLSX.writeFile(wb, 'eu-net-salary-2026.xlsx');
    };

    window.showUpdateInfo = function() {
      alert(currentLang==='fa' ?
        'داده‌ها ۲۰۲۶:\n• DE: BMF PAP + SV\n• FR: cotisations + IR barème\n• IT: INPS + IRPEF 23/33/43%\n• NL: Belastingdienst Box 1\n\nمنابع رسمی را همیشه بررسی کنید.' :
        currentLang==='de' ?
        'Daten 2026:\n• DE: BMF PAP + SV\n• FR: Cotisations + IR\n• IT: INPS + IRPEF\n• NL: Belastingdienst Box 1\n\nOffizielle Quellen prüfen.' :
        'Data 2026:\n• DE: BMF PAP + SV\n• FR: cotisations + IR\n• IT: INPS + IRPEF\n• NL: Belastingdienst Box 1\n\nAlways verify official sources.');
    };

    toggleInput();
    let savedLang = 'fa';
    try { savedLang = localStorage.getItem('netSalaryLang') || 'fa'; } catch (e) {}
    setLang(savedLang);
    onCountryChange();

    // PWA service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
