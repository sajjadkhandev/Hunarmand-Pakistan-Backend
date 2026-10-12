/**
 * Phase 4 Category & Public Catalog Test Runner
 * Validates category schema, auto slug generation, and default category fallback
 */

const { Category } = require('../models');
const { categories } = require('./seedCategories');
const logger = require('./logger');

const runCategoryTests = async () => {
  logger.info('--- Running Phase 4 Category & Public Catalog Tests ---');
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

  // 1. Verify default Pakistani categories catalog count
  assert('Catalog: Default categories contains 10 key Pakistani trades', categories.length === 10);

  // 2. Verify mandatory trades are included
  const slugs = categories.map((c) => c.slug);
  assert('Catalog: Includes plumber, electrician, ac-technician, and carpenter', ['plumber', 'electrician', 'ac-technician', 'carpenter'].every((k) => slugs.includes(k)));

  // 3. Verify slug auto-generation hook on Category model
  const testCat = new Category({
    name: 'Solar Inverter Expert',
    description: 'Expert for high capacity on-grid systems',
    icon: '☀️',
  });
  await testCat.validate();
  assert('Model: Auto-generates clean slug from name', testCat.slug === 'solar-inverter-expert');

  // 4. Verify sorting order defaults to number
  assert('Model: sortOrder is numeric', typeof testCat.sortOrder === 'number');

  logger.info(`--- Result: ${passed}/${total} Category Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runCategoryTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runCategoryTests;
