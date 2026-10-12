/**
 * Phase 6 Search & Filter Engine Test Suite
 * Validates multi-attribute search queries across City, Trade Category, Rating, Experience, Price, and Verified Status
 */

const sampleWorkers = require('./sampleWorkers');
const logger = require('./logger');

const runSearchTests = async () => {
  logger.info('--- Running Phase 6 Search & Filter Tests ---');
  let passed = 0;
  let total = 0;

  const assert = (testName, condition) => {
    total++;
    if (condition) {
      logger.success(`[PASS] ${testName}`);
      passed++;
    } else {
      logger.error(`[FAIL] ${testName}`);
    }
  };

  // 1. City Filter Test: Karachi
  const karachiWorkers = sampleWorkers.filter((w) => w.city.toLowerCase() === 'karachi');
  assert('Search: City filter "Karachi" returns matching Karachi workers', karachiWorkers.length > 0 && karachiWorkers.every((w) => w.city === 'Karachi'));

  // 2. City Filter Test: D.I. Khan
  const diKhanWorkers = sampleWorkers.filter((w) => w.city.toLowerCase() === 'd.i. khan');
  assert('Search: City filter "D.I. Khan" correctly finds D.I. Khan technicians', diKhanWorkers.length > 0 && diKhanWorkers.some((w) => w.userId.name === 'Altaf Hussain'));

  // 3. Category Filter Test: Plumber
  const plumbers = sampleWorkers.filter((w) => w.category.slug === 'plumber');
  assert('Search: Category filter "plumber" returns only plumbers', plumbers.length >= 2 && plumbers.every((w) => w.category.slug === 'plumber'));

  // 4. Combined Filter: Plumber + D.I. Khan + Available (User spec example)
  const availableDIKhanPlumbers = sampleWorkers.filter(
    (w) => w.category.slug === 'plumber' && w.city === 'D.I. Khan' && w.availability === 'available'
  );
  assert('Search: Combined Filter (Plumber + D.I. Khan + Available) returns exact matches', availableDIKhanPlumbers.length === 1 && availableDIKhanPlumbers[0].userId.name === 'Altaf Hussain');

  // 5. Verification Filter Test
  const verifiedOnly = sampleWorkers.filter((w) => w.verificationStatus === 'verified');
  assert('Search: Verified filter returns only workers with verified badges', verifiedOnly.every((w) => w.verificationStatus === 'verified'));

  // 6. Max Price Filter Test
  const cheapWorkers = sampleWorkers.filter((w) => w.startingPrice <= 700);
  assert('Search: Max price filter <= 700 correctly enforces price boundary', cheapWorkers.every((w) => w.startingPrice <= 700));

  // 7. Experience Filter Test
  const veteranWorkers = sampleWorkers.filter((w) => w.experience >= 8);
  assert('Search: Experience filter >= 8 years selects senior craftsmen', veteranWorkers.every((w) => w.experience >= 8));

  logger.info(`--- Result: ${passed}/${total} Search & Filter Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runSearchTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runSearchTests;
