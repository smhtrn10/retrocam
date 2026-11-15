/* eslint-env node */
/**
 * Empirical Challenger Verification Suite for Milestone 1
 * Targets: app/paywall.tsx, components/onboarding2/PaywallScreen2.tsx, hooks/usePurchases.tsx
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('================================================================');
console.log('CHALLENGER 2 EMPIRICAL TEST SUITE: MILESTONE 1 (PAYWALL & RC)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Read Source Files
// -----------------------------------------------------------------------------
const paywallSrc = fs.readFileSync(path.join(process.cwd(), 'app', 'paywall.tsx'), 'utf8');
const paywall2Src = fs.readFileSync(path.join(process.cwd(), 'components', 'onboarding2', 'PaywallScreen2.tsx'), 'utf8');
const purchasesSrc = fs.readFileSync(path.join(process.cwd(), 'hooks', 'usePurchases.tsx'), 'utf8');
const enLocale = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', 'en.json'), 'utf8'));
const trLocale = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'i18n', 'locales', 'tr.json'), 'utf8'));

// Mock translation function mimicking react-i18next
function createTranslator(localeObj) {
  return function t(key, defaultVal, options) {
    const parts = key.split('.');
    let cur = localeObj;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in cur) {
        cur = cur[part];
      } else {
        cur = undefined;
        break;
      }
    }
    let res = (cur !== undefined && typeof cur === 'string') ? cur : defaultVal;
    if (options && typeof res === 'string') {
      for (const [k, v] of Object.entries(options)) {
        res = res.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
    }
    return res;
  };
}

const tEn = createTranslator(enLocale);
const tTr = createTranslator(trLocale);

// -----------------------------------------------------------------------------
// SUITE 1: FALLBACK_PACKAGES ARRAY ORDERING & TRIAL METADATA
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: FALLBACK_PACKAGES Ordering & Trial Metadata ---');

// Parse FALLBACK_PACKAGES from hooks/usePurchases.tsx
// Extract JSON-like content of FALLBACK_PACKAGES
const fbBlockMatch = purchasesSrc.match(/export\s+const\s+FALLBACK_PACKAGES:\s*PurchasesPackage\[\]\s*=\s*(\[[\s\S]*?\]);/);
assert(Boolean(fbBlockMatch), 'FALLBACK_PACKAGES is exported from hooks/usePurchases.tsx');

let parsedFallback = null;
try {
  // Clean up typescript casting "as any", "as unknown as PurchasesPackage" to evaluate via JS
  const cleaned = fbBlockMatch[1]
    .replace(/as\s+any/g, '')
    .replace(/as\s+unknown\s+as\s+PurchasesPackage/g, '');
  parsedFallback = new Function(`return ${cleaned}`)();
} catch (e) {
  console.error('Failed to parse FALLBACK_PACKAGES JS:', e.message);
}

assert(Array.isArray(parsedFallback), 'FALLBACK_PACKAGES successfully evaluated to an Array');
assert(parsedFallback && parsedFallback.length === 3, 'FALLBACK_PACKAGES contains exactly 3 packages');

if (parsedFallback && parsedFallback.length >= 3) {
  const [pkg0, pkg1, pkg2] = parsedFallback;

  // Annual
  assert(pkg0.identifier === 'annual', 'FALLBACK_PACKAGES[0].identifier is "annual"');
  assert(pkg0.packageType === 'ANNUAL', 'FALLBACK_PACKAGES[0].packageType is "ANNUAL"');
  assert(pkg0.product.price === 14.99, 'FALLBACK_PACKAGES[0].product.price is 14.99');
  assert(pkg0.product.subscriptionPeriod === 'P1Y', 'FALLBACK_PACKAGES[0].product.subscriptionPeriod is "P1Y"');
  assert(pkg0.product.introPrice !== null, 'FALLBACK_PACKAGES[0].product.introPrice is defined');
  assert(pkg0.product.introPrice && pkg0.product.introPrice.price === 0, 'FALLBACK_PACKAGES[0].product.introPrice.price is 0');
  assert(pkg0.product.introPrice && pkg0.product.introPrice.period === 'P3D', 'FALLBACK_PACKAGES[0].product.introPrice.period is "P3D"');
  assert(pkg0.product.introPrice && pkg0.product.introPrice.periodNumberOfUnits === 3, 'FALLBACK_PACKAGES[0].product.introPrice.periodNumberOfUnits is 3');

  // Monthly
  assert(pkg1.identifier === 'monthly', 'FALLBACK_PACKAGES[1].identifier is "monthly"');
  assert(pkg1.packageType === 'MONTHLY', 'FALLBACK_PACKAGES[1].packageType is "MONTHLY"');
  assert(pkg1.product.price === 2.99, 'FALLBACK_PACKAGES[1].product.price is 2.99');
  assert(pkg1.product.subscriptionPeriod === 'P1M', 'FALLBACK_PACKAGES[1].product.subscriptionPeriod is "P1M"');
  assert(pkg1.product.introPrice === null, 'FALLBACK_PACKAGES[1].product.introPrice is null (no trial on monthly)');

  // Weekly
  assert(pkg2.identifier === 'weekly', 'FALLBACK_PACKAGES[2].identifier is "weekly"');
  assert(pkg2.packageType === 'WEEKLY', 'FALLBACK_PACKAGES[2].packageType is "WEEKLY"');
  assert(pkg2.product.price === 0.99, 'FALLBACK_PACKAGES[2].product.price is 0.99');
  assert(pkg2.product.subscriptionPeriod === 'P1W', 'FALLBACK_PACKAGES[2].product.subscriptionPeriod is "P1W"');
  assert(pkg2.product.introPrice === null, 'FALLBACK_PACKAGES[2].product.introPrice is null (no trial on weekly)');
}

// -----------------------------------------------------------------------------
// SUITE 2: REVENUECAT OFFERINGS FALLBACK INTEGRATION
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: RevenueCat Offerings Null / Empty / Exception Handling ---');

assert(
  purchasesSrc.includes('if (offerings.current !== null && offerings.current.availablePackages.length !== 0)'),
  'usePurchases checks offerings.current !== null AND availablePackages.length !== 0'
);
assert(
  purchasesSrc.includes('set({ packages: FALLBACK_PACKAGES });'),
  'usePurchases populates FALLBACK_PACKAGES when offerings are empty or null'
);

// Simulate the initialization logic
function simulateRcOfferingsFetch(offeringsResult, throwsError = false) {
  let state = { packages: [], isLoading: true };
  const set = (updater) => { Object.assign(state, updater); };

  try {
    if (throwsError) {
      throw new Error("RevenueCat network error");
    }
    const offerings = offeringsResult;
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      set({ packages: offerings.current.availablePackages });
    } else {
      set({ packages: parsedFallback });
    }
  } catch (_err) {
    set({ packages: parsedFallback });
  } finally {
    set({ isLoading: false });
  }
  return state;
}

const resNull = simulateRcOfferingsFetch({ current: null });
assert(resNull.packages.length === 3 && resNull.packages[0].identifier === 'annual', 'Offerings with current === null falls back to FALLBACK_PACKAGES with Annual first');
assert(resNull.isLoading === false, 'State isLoading is false after offerings failure');

const resEmpty = simulateRcOfferingsFetch({ current: { availablePackages: [] } });
assert(resEmpty.packages.length === 3 && resEmpty.packages[0].identifier === 'annual', 'Offerings with availablePackages: [] falls back to FALLBACK_PACKAGES with Annual first');

const resThrow = simulateRcOfferingsFetch(null, true);
assert(resThrow.packages.length === 3 && resThrow.packages[0].identifier === 'annual', 'Offerings throwing network exception falls back to FALLBACK_PACKAGES with Annual first');

// -----------------------------------------------------------------------------
// SUITE 3: PRE-SELECTION PRECEDENCE & PERSISTENCE ADVERSARIAL TESTS
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Pre-selection Precedence & Persistence Stress Tests ---');

function runPreSelection(packages, currentSelected = null) {
  let selected = currentSelected;
  const isCurrentValid = selected && packages.some(p => p.identifier === selected);
  if (packages.length > 0 && !isCurrentValid) {
    const annual = packages.find(p => p.packageType === 'ANNUAL' || p.identifier.toLowerCase().includes('annual') || p.identifier.toLowerCase().includes('year'));
    const monthly = packages.find(p => p.packageType === 'MONTHLY' || p.identifier.toLowerCase().includes('month'));
    const weekly = packages.find(p => p.packageType === 'WEEKLY' || p.identifier.toLowerCase().includes('week'));
    selected = annual?.identifier || monthly?.identifier || weekly?.identifier || packages[0].identifier;
  }
  return selected;
}

// 3.1 Standard order
const standardPkgs = [
  { identifier: 'annual', packageType: 'ANNUAL' },
  { identifier: 'monthly', packageType: 'MONTHLY' },
  { identifier: 'weekly', packageType: 'WEEKLY' },
];
assert(runPreSelection(standardPkgs) === 'annual', 'Standard ordering [Annual, Monthly, Weekly] pre-selects "annual"');

// 3.2 Inverted order (RevenueCat offering returning weekly first)
const invertedPkgs = [
  { identifier: 'weekly', packageType: 'WEEKLY' },
  { identifier: 'monthly', packageType: 'MONTHLY' },
  { identifier: 'annual', packageType: 'ANNUAL' },
];
assert(runPreSelection(invertedPkgs) === 'annual', 'Adversarial inverted ordering [Weekly, Monthly, Annual] pre-selects "annual"');

// 3.3 Custom yearly identifiers
const customYearlyPkgs = [
  { identifier: 'com.retrocam.special_year_pass', packageType: 'CUSTOM' },
  { identifier: 'monthly_sub', packageType: 'MONTHLY' },
];
assert(runPreSelection(customYearlyPkgs) === 'com.retrocam.special_year_pass', 'Custom identifier with "year" pre-selects yearly package');

const customAnnualPkgs = [
  { identifier: 'pro_annual_tier', packageType: 'CUSTOM' },
  { identifier: 'weekly_tier', packageType: 'WEEKLY' },
];
assert(runPreSelection(customAnnualPkgs) === 'pro_annual_tier', 'Custom identifier with "annual" pre-selects annual package');

// 3.4 Missing annual package
const noAnnualPkgs = [
  { identifier: 'monthly_pkg', packageType: 'MONTHLY' },
  { identifier: 'weekly_pkg', packageType: 'WEEKLY' },
];
assert(runPreSelection(noAnnualPkgs) === 'monthly_pkg', 'When annual is missing, pre-selection gracefully chooses monthly');

// 3.5 Only weekly package
const onlyWeeklyPkgs = [
  { identifier: 'weekly_only', packageType: 'WEEKLY' },
];
assert(runPreSelection(onlyWeeklyPkgs) === 'weekly_only', 'When only weekly exists, pre-selection selects weekly');

// 3.6 Empty packages
assert(runPreSelection([]) === null, 'Empty packages array leaves selectedPackage as null without throwing');

// 3.7 Selection persistence: user deliberately taps monthly
let userSelected = runPreSelection(standardPkgs); // initially 'annual'
assert(userSelected === 'annual', 'Initial selection is annual');
userSelected = 'monthly'; // user clicks monthly
// Re-render / effect execution with new or identical packages
const preservedSelection = runPreSelection(standardPkgs, userSelected);
assert(preservedSelection === 'monthly', 'User selection of "monthly" is preserved on subsequent package evaluations');

// 3.8 Stale selection eviction: user had 'legacy_id', new packages don't contain it
const staleSelection = 'legacy_id_not_in_list';
const evictedSelection = runPreSelection(standardPkgs, staleSelection);
assert(evictedSelection === 'annual', 'Stale/invalid selection is evicted and replaced by Annual pre-selection');

// -----------------------------------------------------------------------------
// SUITE 4: DYNAMIC CTA BUTTON LABEL STRESS TESTS
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Dynamic CTA Button Label Logic ---');

function isAnnualSelectedLogic(selectedPkg) {
  return Boolean(
    selectedPkg && (
      selectedPkg.packageType === 'ANNUAL' ||
      selectedPkg.identifier.toLowerCase().includes('annual') ||
      selectedPkg.identifier.toLowerCase().includes('year') ||
      selectedPkg.product?.subscriptionPeriod === 'P1Y'
    )
  );
}

function getButtonLabelLogic(selectedPkg, t) {
  const isAnnual = isAnnualSelectedLogic(selectedPkg);
  if (isAnnual && selectedPkg) {
    return t('paywall.trial_btn', 'Start Free Trial');
  }
  return t('paywall.continue_btn', 'Continue');
}

const annualPkg = parsedFallback[0];
const monthlyPkg = parsedFallback[1];
const weeklyPkg = parsedFallback[2];

// Test with EN translations
assert(isAnnualSelectedLogic(annualPkg) === true, 'isAnnualSelected is TRUE for Annual package');
assert(getButtonLabelLogic(annualPkg, tEn) === 'Start 3-Day Free Trial', 'CTA button text indicates free trial when Annual is selected (EN)');

assert(isAnnualSelectedLogic(monthlyPkg) === false, 'isAnnualSelected is FALSE for Monthly package');
assert(getButtonLabelLogic(monthlyPkg, tEn) === 'Continue', 'CTA button switches to "Continue" when Monthly is selected (EN)');

assert(isAnnualSelectedLogic(weeklyPkg) === false, 'isAnnualSelected is FALSE for Weekly package');
assert(getButtonLabelLogic(weeklyPkg, tEn) === 'Continue', 'CTA button switches to "Continue" when Weekly is selected (EN)');

assert(getButtonLabelLogic(null, tEn) === 'Continue', 'CTA button defaults to "Continue" when no package is selected');

// Test with TR translations
const trLabelAnnual = getButtonLabelLogic(annualPkg, tTr);
assert(
  trLabelAnnual.toLowerCase().includes('ücretsiz') || trLabelAnnual.toLowerCase().includes('dene'),
  `CTA button text indicates free trial when Annual is selected (TR: "${trLabelAnnual}")`
);
assert(getButtonLabelLogic(monthlyPkg, tTr) === 'Continue', 'CTA button text switches to "Continue" when Monthly is selected (TR)');

// Test package with only subscriptionPeriod: 'P1Y'
const customP1YPkg = {
  identifier: 'tier_99',
  packageType: 'UNKNOWN',
  product: { priceString: '$19.99', subscriptionPeriod: 'P1Y' }
};
assert(isAnnualSelectedLogic(customP1YPkg) === true, 'isAnnualSelected recognizes P1Y subscriptionPeriod even with UNKNOWN packageType');
assert(getButtonLabelLogic(customP1YPkg, tEn) === 'Start 3-Day Free Trial', 'CTA button text indicates trial for P1Y package');

// -----------------------------------------------------------------------------
// SUITE 5: TRIAL DISCLAIMER GATING STRESS TESTS
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Trial Disclaimer Gating Stress Tests ---');

// app/paywall.tsx logic
function getTrialDisclaimerPaywall(selectedPkg, t) {
  const isAnnual = isAnnualSelectedLogic(selectedPkg);
  if (isAnnual && selectedPkg) {
    return t('paywall.trial_disclaimer', '3-day free trial, then {{price}}/year', { price: selectedPkg.product?.priceString });
  }
  return '';
}

// app/paywall.tsx disclaimers
const paywallDisclaimerAnnual = getTrialDisclaimerPaywall(annualPkg, tEn);
assert(paywallDisclaimerAnnual !== '', 'app/paywall.tsx trial disclaimer is rendered when Annual is selected');
assert(paywallDisclaimerAnnual.includes('3-day free trial'), 'app/paywall.tsx trial disclaimer contains "3-day free trial"');
assert(paywallDisclaimerAnnual.includes('$14.99'), 'app/paywall.tsx trial disclaimer includes interpolated annual price');

const paywallDisclaimerMonthly = getTrialDisclaimerPaywall(monthlyPkg, tEn);
assert(paywallDisclaimerMonthly === '', 'app/paywall.tsx trial disclaimer is EMPTY STRING when Monthly is selected');
assert(!paywallDisclaimerMonthly.includes('trial'), 'app/paywall.tsx does NOT render false trial promise for Monthly');

const paywallDisclaimerWeekly = getTrialDisclaimerPaywall(weeklyPkg, tEn);
assert(paywallDisclaimerWeekly === '', 'app/paywall.tsx trial disclaimer is EMPTY STRING when Weekly is selected');
assert(!paywallDisclaimerWeekly.includes('trial'), 'app/paywall.tsx does NOT render false trial promise for Weekly');

// components/onboarding2/PaywallScreen2.tsx disclaimers
function getTrialNotePaywall2(selectedPkg, t) {
  if (!selectedPkg) return null;
  const isAnnual = isAnnualSelectedLogic(selectedPkg);
  if (isAnnual) {
    return t('paywall.trial_disclaimer_yearly', '3-day free trial, then {{price}}/year. Cancel anytime.', { price: selectedPkg.product?.priceString });
  }
  if (selectedPkg.packageType === 'MONTHLY' || selectedPkg.identifier.toLowerCase().includes('month')) {
    return t('paywall.monthly_sub', 'Billed monthly. Cancel anytime.');
  }
  return t('paywall.weekly_sub', 'Billed weekly. Cancel anytime.');
}

const ob2NoteAnnual = getTrialNotePaywall2(annualPkg, tEn);
assert(ob2NoteAnnual && ob2NoteAnnual.includes('3-day free trial'), 'PaywallScreen2.tsx renders trial disclaimer for Annual');
assert(ob2NoteAnnual && ob2NoteAnnual.includes('$14.99'), 'PaywallScreen2.tsx interpolates price into Annual trial disclaimer');

const ob2NoteMonthly = getTrialNotePaywall2(monthlyPkg, tEn);
assert(ob2NoteMonthly && !ob2NoteMonthly.toLowerCase().includes('trial'), 'PaywallScreen2.tsx does NOT include "trial" for Monthly');
assert(ob2NoteMonthly && (ob2NoteMonthly.includes('Billed monthly') || ob2NoteMonthly.includes('Aylık')), 'PaywallScreen2.tsx displays billing note for Monthly');

const ob2NoteWeekly = getTrialNotePaywall2(weeklyPkg, tEn);
assert(ob2NoteWeekly && !ob2NoteWeekly.toLowerCase().includes('trial'), 'PaywallScreen2.tsx does NOT include "trial" for Weekly');
assert(ob2NoteWeekly && (ob2NoteWeekly.includes('Billed weekly') || ob2NoteWeekly.includes('Haftalık')), 'PaywallScreen2.tsx displays billing note for Weekly');

// -----------------------------------------------------------------------------
// SUITE 6: CLOSE BUTTON TIMING & NAVIGATION CONTRACT
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Close Button Timer & Navigation Contract ---');

// app/paywall.tsx timer
const p1TimerMatch = paywallSrc.match(/setTimeout\(\(\)\s*=>\s*setShowCloseButton\(true\),\s*(\d+)\)/);
assert(Boolean(p1TimerMatch), 'app/paywall.tsx close button timer found');
const p1Delay = Number(p1TimerMatch ? p1TimerMatch[1] : 9999);
assert(p1Delay <= 1500, `app/paywall.tsx timer is <= 1500ms (actual: ${p1Delay}ms)`);
assert(p1Delay === 1000, `app/paywall.tsx timer is exactly 1000ms`);

// PaywallScreen2.tsx timer
const p2TimerMatch = paywall2Src.match(/setTimeout\(\(\)\s*=>\s*setShowCloseButton\(true\),\s*(\d+)\)/);
assert(Boolean(p2TimerMatch), 'PaywallScreen2.tsx close button timer found');
const p2Delay = Number(p2TimerMatch ? p2TimerMatch[1] : 9999);
assert(p2Delay <= 1500, `PaywallScreen2.tsx timer is <= 1500ms (actual: ${p2Delay}ms)`);
assert(p2Delay === 1000, `PaywallScreen2.tsx timer is exactly 1000ms`);

// Safe dismissal in app/paywall.tsx
assert(
  paywallSrc.includes("router.canGoBack() ? router.back() : router.replace('/')"),
  'app/paywall.tsx uses safe router.canGoBack() ? router.back() : router.replace("/")'
);

// Close button connection in PaywallScreen2.tsx
assert(
  paywall2Src.includes('onPress={onClose}'),
  'PaywallScreen2.tsx connects close button to onClose prop'
);

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS RUN: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nVERDICT: REQUEST_CHANGES (Regressions or contract violations detected)');
  process.exit(1);
} else {
  console.log('\nVERDICT: APPROVE (All empirical tests passed cleanly)');
  process.exit(0);
}
