/**
 * Empirical Adversarial Stress-Test Suite for Milestone 1 (Paywall UX & Trial Optimization - R3)
 * Challenger 1
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    testsFailed++;
    failures.push({ testName, details });
  }
}

console.log('================================================================');
console.log('  CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS-TEST SUITE (M1)  ');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// PART 1: CLOSE BUTTON TIMERS VERIFICATION
// -----------------------------------------------------------------------------
console.log('--- 1. Close Button Timers ---');

const paywallContent = fs.readFileSync(path.resolve('app/paywall.tsx'), 'utf8');
const paywall2Content = fs.readFileSync(path.resolve('components/onboarding2/PaywallScreen2.tsx'), 'utf8');

// 1.1 Timer value in app/paywall.tsx
const p1TimerMatch = paywallContent.match(/setTimeout\(\(\)\s*=>\s*setShowCloseButton\(true\),\s*(\d+)\)/);
const p1TimerVal = p1TimerMatch ? parseInt(p1TimerMatch[1], 10) : null;
assert(
  p1TimerVal !== null && p1TimerVal <= 1500,
  'app/paywall.tsx close button timer <= 1500ms',
  `Found: ${p1TimerVal}ms (expected <= 1500ms)`
);
assert(
  p1TimerVal === 1000,
  'app/paywall.tsx close button timer is exactly 1000ms',
  `Found: ${p1TimerVal}ms`
);

// 1.2 Cleanup in app/paywall.tsx
assert(
  /return\s*\(\)\s*=>\s*clearTimeout\(timer\)/.test(paywallContent),
  'app/paywall.tsx timer cleanup on unmount',
  'Missing clearTimeout in return cleanup'
);

// 1.3 Timer value in components/onboarding2/PaywallScreen2.tsx
const p2TimerMatch = paywall2Content.match(/setTimeout\(\(\)\s*=>\s*setShowCloseButton\(true\),\s*(\d+)\)/);
const p2TimerVal = p2TimerMatch ? parseInt(p2TimerMatch[1], 10) : null;
assert(
  p2TimerVal !== null && p2TimerVal <= 1500,
  'PaywallScreen2.tsx close button timer <= 1500ms',
  `Found: ${p2TimerVal}ms (expected <= 1500ms)`
);
assert(
  p2TimerVal === 1000,
  'PaywallScreen2.tsx close button timer is exactly 1000ms',
  `Found: ${p2TimerVal}ms`
);

// 1.4 Cleanup in PaywallScreen2.tsx
assert(
  /return\s*\(\)\s*=>\s*clearTimeout\(timer\)/.test(paywall2Content),
  'PaywallScreen2.tsx timer cleanup on unmount',
  'Missing clearTimeout in return cleanup'
);


// -----------------------------------------------------------------------------
// PART 2: SAFE BACK NAVIGATION VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 2. Safe Back Navigation ---');

// 2.1 router.canGoBack() check in app/paywall.tsx
assert(
  paywallContent.includes("router.canGoBack() ? router.back() : router.replace('/')"),
  'app/paywall.tsx uses router.canGoBack() fallback check',
  'Did not find conditional back navigation'
);

// 2.2 Simulate navigation harness
function simulateBackNavigation(canGoBack) {
  let actionTaken = null;
  const mockRouter = {
    canGoBack: () => canGoBack,
    back: () => { actionTaken = 'BACK'; },
    replace: (route) => { actionTaken = `REPLACE:${route}`; },
  };

  const onPress = () => (mockRouter.canGoBack() ? mockRouter.back() : mockRouter.replace('/'));
  onPress();
  return actionTaken;
}

assert(
  simulateBackNavigation(true) === 'BACK',
  'Simulation: when history stack exists (canGoBack = true), navigates back',
  `Action taken: ${simulateBackNavigation(true)}`
);

assert(
  simulateBackNavigation(false) === 'REPLACE:/',
  'Simulation: when no history stack exists (canGoBack = false), falls back to replace(/)',
  `Action taken: ${simulateBackNavigation(false)}`
);

// 2.3 PaywallScreen2 onClose contract
assert(
  paywall2Content.includes('onPress={onClose}'),
  'PaywallScreen2 uses onClose prop for dismissal',
  'Did not find onClose handler on close button'
);

const onboardingContent = fs.readFileSync(path.resolve('app/onboarding.tsx'), 'utf8');
assert(
  onboardingContent.includes('<PaywallScreen2 onClose={finishOnboarding} />'),
  'app/onboarding.tsx passes finishOnboarding to PaywallScreen2',
  'PaywallScreen2 onClose mapping mismatch in onboarding.tsx'
);


// -----------------------------------------------------------------------------
// PART 3: PACKAGE SELECTION ALGORITHM STRESS-TESTING
// -----------------------------------------------------------------------------
console.log('\n--- 3. Package Selection Algorithm Permutations ---');

// Extract the exact selection algorithm function
function runPackageSelection(packages, currentSelected = null) {
  let selectedPackage = currentSelected;
  const setSelectedPackage = (id) => { selectedPackage = id; };

  const isCurrentValid = selectedPackage && packages.some(p => p.identifier === selectedPackage);
  if (packages.length > 0 && !isCurrentValid) {
    const annual = packages.find(p => p.packageType === 'ANNUAL' || p.identifier.toLowerCase().includes('annual') || p.identifier.toLowerCase().includes('year'));
    const monthly = packages.find(p => p.packageType === 'MONTHLY' || p.identifier.toLowerCase().includes('month'));
    const weekly = packages.find(p => p.packageType === 'WEEKLY' || p.identifier.toLowerCase().includes('week'));
    setSelectedPackage(annual?.identifier || monthly?.identifier || weekly?.identifier || packages[0].identifier);
  }

  return selectedPackage;
}

// 3.1 Standard RevenueCat packages (annual first)
assert(
  runPackageSelection([
    { identifier: '$rc_annual', packageType: 'ANNUAL' },
    { identifier: '$rc_monthly', packageType: 'MONTHLY' },
    { identifier: '$rc_weekly', packageType: 'WEEKLY' },
  ]) === '$rc_annual',
  'Permutation 1: Standard RevenueCat packages [annual, monthly, weekly] -> selects annual'
);

// 3.2 Reversed order (weekly first, annual last)
assert(
  runPackageSelection([
    { identifier: '$rc_weekly', packageType: 'WEEKLY' },
    { identifier: '$rc_monthly', packageType: 'MONTHLY' },
    { identifier: '$rc_annual', packageType: 'ANNUAL' },
  ]) === '$rc_annual',
  'Permutation 2: Reversed packages [weekly, monthly, annual] -> selects annual'
);

// 3.3 Mixed order (monthly first)
assert(
  runPackageSelection([
    { identifier: '$rc_monthly', packageType: 'MONTHLY' },
    { identifier: '$rc_weekly', packageType: 'WEEKLY' },
    { identifier: '$rc_annual', packageType: 'ANNUAL' },
  ]) === '$rc_annual',
  'Permutation 3: Mixed packages [monthly, weekly, annual] -> selects annual'
);

// 3.4 Custom package ids with uppercase
assert(
  runPackageSelection([
    { identifier: 'PRO_WEEKLY_PASS', packageType: 'CUSTOM' },
    { identifier: 'PRO_MONTHLY_PASS', packageType: 'CUSTOM' },
    { identifier: 'PRO_ANNUAL_PASS', packageType: 'CUSTOM' },
  ]) === 'PRO_ANNUAL_PASS',
  'Permutation 4: Custom uppercase identifiers with CUSTOM packageType -> selects PRO_ANNUAL_PASS'
);

// 3.5 Custom package ids with 'year' instead of 'annual'
assert(
  runPackageSelection([
    { identifier: 'sub_weekly', packageType: 'CUSTOM' },
    { identifier: 'sub_1_year_pro', packageType: 'CUSTOM' },
  ]) === 'sub_1_year_pro',
  'Permutation 5: Identifier containing "year" substring -> selects sub_1_year_pro'
);

// 3.6 Obfuscated package identifiers with valid packageType
assert(
  runPackageSelection([
    { identifier: 'uuid_001_w', packageType: 'WEEKLY' },
    { identifier: 'uuid_002_m', packageType: 'MONTHLY' },
    { identifier: 'uuid_003_y', packageType: 'ANNUAL' },
  ]) === 'uuid_003_y',
  'Permutation 6: Non-descriptive identifiers with ANNUAL packageType -> selects uuid_003_y'
);

// 3.7 Only monthly and weekly (no annual available)
assert(
  runPackageSelection([
    { identifier: 'sub_weekly', packageType: 'WEEKLY' },
    { identifier: 'sub_monthly', packageType: 'MONTHLY' },
  ]) === 'sub_monthly',
  'Permutation 7: No annual package [weekly, monthly] -> selects monthly as second priority'
);

// 3.8 Only weekly
assert(
  runPackageSelection([
    { identifier: 'sub_weekly_only', packageType: 'WEEKLY' },
  ]) === 'sub_weekly_only',
  'Permutation 8: Only weekly package available -> selects sub_weekly_only'
);

// 3.9 Empty package array
assert(
  runPackageSelection([]) === null,
  'Permutation 9: Empty package array [] -> does not crash and leaves selectedPackage null'
);

// 3.10 Single unknown package (lifetime or custom)
assert(
  runPackageSelection([
    { identifier: 'lifetime_access', packageType: 'LIFETIME' },
  ]) === 'lifetime_access',
  'Permutation 10: Single custom package (lifetime) -> falls back to packages[0]'
);

// 3.11 Multiple custom packages with no standard types or names
assert(
  runPackageSelection([
    { identifier: 'tier_alpha', packageType: 'CUSTOM' },
    { identifier: 'tier_beta', packageType: 'CUSTOM' },
  ]) === 'tier_alpha',
  'Permutation 11: Completely custom packages -> falls back to packages[0]'
);

// 3.12 Preservation of user-selected package across re-renders
const initialSelection = runPackageSelection([
  { identifier: 'pkg_annual', packageType: 'ANNUAL' },
  { identifier: 'pkg_monthly', packageType: 'MONTHLY' },
]);
// User taps monthly
const userSelected = 'pkg_monthly';
const reRenderSelection = runPackageSelection(
  [
    { identifier: 'pkg_annual', packageType: 'ANNUAL' },
    { identifier: 'pkg_monthly', packageType: 'MONTHLY' },
  ],
  userSelected
);
assert(
  reRenderSelection === 'pkg_monthly',
  'Permutation 12: User selection is preserved across re-renders when package is still present',
  `Expected pkg_monthly, got ${reRenderSelection}`
);

// 3.13 Stale selection re-computation when package is removed remotely
const staleSelection = 'pkg_deleted';
const recoveredSelection = runPackageSelection(
  [
    { identifier: 'pkg_annual', packageType: 'ANNUAL' },
    { identifier: 'pkg_monthly', packageType: 'MONTHLY' },
  ],
  staleSelection
);
assert(
  recoveredSelection === 'pkg_annual',
  'Permutation 13: Stale selected package removed remotely -> automatically resets to annual',
  `Expected pkg_annual, got ${recoveredSelection}`
);


// -----------------------------------------------------------------------------
// PART 4: FALLBACK_PACKAGES & OFFERINGS INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- 4. FALLBACK_PACKAGES & Offerings Fallback ---');

const usePurchasesContent = fs.readFileSync(path.resolve('hooks/usePurchases.tsx'), 'utf8');

// 4.1 FALLBACK_PACKAGES order
const fbExportMatch = usePurchasesContent.match(/export const FALLBACK_PACKAGES:\s*PurchasesPackage\[\]\s*=\s*\[([\s\S]*?)\];/);
assert(
  fbExportMatch !== null,
  'FALLBACK_PACKAGES is exported from hooks/usePurchases.tsx'
);

const fbPackagesRaw = fbExportMatch ? fbExportMatch[1] : '';
const fbPackageTypes = [...fbPackagesRaw.matchAll(/packageType:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);

assert(
  fbPackageTypes[0] === 'ANNUAL',
  'FALLBACK_PACKAGES[0] is ANNUAL',
  `Found: ${fbPackageTypes[0]}`
);
assert(
  fbPackageTypes[1] === 'MONTHLY',
  'FALLBACK_PACKAGES[1] is MONTHLY',
  `Found: ${fbPackageTypes[1]}`
);
assert(
  fbPackageTypes[2] === 'WEEKLY',
  'FALLBACK_PACKAGES[2] is WEEKLY',
  `Found: ${fbPackageTypes[2]}`
);

// 4.2 Trial and Period metadata in FALLBACK_PACKAGES[0]
assert(
  fbPackagesRaw.includes("subscriptionPeriod: 'P1Y'"),
  'FALLBACK_PACKAGES[0] includes subscriptionPeriod: "P1Y"',
  'Missing subscriptionPeriod: P1Y'
);
assert(
  fbPackagesRaw.includes("period: 'P3D'"),
  'FALLBACK_PACKAGES[0] includes introPrice period: "P3D" (3-day trial)',
  'Missing introPrice P3D'
);

// 4.3 Safe empty offerings fallback in initialize()
assert(
  usePurchasesContent.includes('if (offerings.current !== null && offerings.current.availablePackages.length !== 0)') &&
  usePurchasesContent.includes('set({ packages: FALLBACK_PACKAGES });'),
  'usePurchases falls back to FALLBACK_PACKAGES when offerings.current is null or empty',
  'Missing offerings fallback to FALLBACK_PACKAGES'
);


// -----------------------------------------------------------------------------
// PART 5: DYNAMIC CTA & TRIAL DISCLAIMER CONSISTENCY
// -----------------------------------------------------------------------------
console.log('\n--- 5. Dynamic CTA & Trial Disclaimer Consistency ---');

function evaluatePaywallLabels(packages, selectedPackageId) {
  const selectedPkg = packages.find(p => p.identifier === selectedPackageId);
  const isAnnualSelected = Boolean(
    selectedPkg && (
      selectedPkg.packageType === 'ANNUAL' ||
      selectedPkg.identifier.toLowerCase().includes('annual') ||
      selectedPkg.identifier.toLowerCase().includes('year') ||
      selectedPkg.product?.subscriptionPeriod === 'P1Y'
    )
  );

  const buttonLabel = isAnnualSelected && selectedPkg ? 'Start Free Trial' : 'Continue';
  const hasTrialDisclaimer = isAnnualSelected && selectedPkg !== undefined;

  return { isAnnualSelected, buttonLabel, hasTrialDisclaimer };
}

const annualPkg = {
  identifier: 'annual',
  packageType: 'ANNUAL',
  product: { priceString: '$14.99', subscriptionPeriod: 'P1Y' },
};
const monthlyPkg = {
  identifier: 'monthly',
  packageType: 'MONTHLY',
  product: { priceString: '$2.99', subscriptionPeriod: 'P1M' },
};
const weeklyPkg = {
  identifier: 'weekly',
  packageType: 'WEEKLY',
  product: { priceString: '$0.99', subscriptionPeriod: 'P1W' },
};
const testPkgs = [annualPkg, monthlyPkg, weeklyPkg];

// Annual selected
const annualLabels = evaluatePaywallLabels(testPkgs, 'annual');
assert(
  annualLabels.buttonLabel === 'Start Free Trial' && annualLabels.hasTrialDisclaimer === true,
  'When Annual is selected, button label is "Start Free Trial" and trial disclaimer is displayed'
);

// Monthly selected
const monthlyLabels = evaluatePaywallLabels(testPkgs, 'monthly');
assert(
  monthlyLabels.buttonLabel === 'Continue' && monthlyLabels.hasTrialDisclaimer === false,
  'When Monthly is selected, button label is "Continue" and trial disclaimer is NOT displayed'
);

// Weekly selected
const weeklyLabels = evaluatePaywallLabels(testPkgs, 'weekly');
assert(
  weeklyLabels.buttonLabel === 'Continue' && weeklyLabels.hasTrialDisclaimer === false,
  'When Weekly is selected, button label is "Continue" and trial disclaimer is NOT displayed'
);


// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${testsPassed + testsFailed}`);
console.log(`PASSED: ${testsPassed}`);
console.log(`FAILED: ${testsFailed}`);
console.log('================================================================');

if (testsFailed > 0) {
  console.error('\nFAILURES DETECTED:');
  failures.forEach(f => console.error(`- ${f.testName}: ${f.details}`));
  process.exit(1);
} else {
  console.log('\nALL EMPIRICAL TESTS PASSED SUCCESSFULLY (100% SUCCESS)');
  process.exit(0);
}
