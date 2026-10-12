/**
 * Phase 5 Worker System Test Runner
 * Validates worker schema constraints, CNIC validation, availability states, and sub-services.
 */

const mongoose = require('mongoose');
const { WorkerProfile } = require('../models');
const logger = require('./logger');

const runWorkerTests = async () => {
  logger.info('--- Running Phase 5 Worker System Tests ---');
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

  const validProfileData = {
    userId: new mongoose.Types.ObjectId(),
    category: new mongoose.Types.ObjectId(),
    skillTitle: 'Master AC Inverter Specialist',
    experience: 6,
    startingPrice: 1200,
    city: 'Karachi',
    area: 'Gulshan-e-Iqbal',
    availability: 'available',
    verificationStatus: 'verified',
    cnicNumber: '42101-1234567-1',
    services: [
      { name: 'Jet Wash AC Service', price: 1500, description: 'Deep coil clean' },
      { name: 'Gas Refill R410A', price: 4000, description: 'American refrigerant' },
    ],
  };

  // 1. Valid Worker Profile instance
  const validProfile = new WorkerProfile(validProfileData);
  const validErr = validProfile.validateSync();
  assert('Worker Profile: Valid complete profile accepted', !validErr);

  // 2. Availability enum constraint
  const invalidAvailabilityProfile = new WorkerProfile({
    ...validProfileData,
    availability: 'sleeping', // Invalid state
  });
  const availErr = invalidAvailabilityProfile.validateSync();
  assert('Worker Profile: Invalid availability state correctly rejected', !!availErr?.errors?.availability);

  // 3. Verification status constraint
  const invalidVerifProfile = new WorkerProfile({
    ...validProfileData,
    verificationStatus: 'super_verified', // Invalid state
  });
  const verifErr = invalidVerifProfile.validateSync();
  assert('Worker Profile: Invalid verificationStatus rejected', !!verifErr?.errors?.verificationStatus);

  // 4. Pakistani CNIC format validation
  const validCnicProfile = new WorkerProfile({
    ...validProfileData,
    cnicNumber: '37405-1234567-3', // Valid NADRA format
  });
  assert('Worker Profile: Valid Pakistani CNIC format accepted', !validCnicProfile.validateSync()?.errors?.cnicNumber);

  const invalidCnicProfile = new WorkerProfile({
    ...validProfileData,
    cnicNumber: '1234567890', // Invalid missing dashes & length
  });
  const cnicErr = invalidCnicProfile.validateSync();
  assert('Worker Profile: Invalid CNIC format correctly rejected', !!cnicErr?.errors?.cnicNumber);

  // 5. Sub-service validation
  const negativeServicePrice = new WorkerProfile({
    ...validProfileData,
    services: [{ name: 'Test Service', price: -500 }],
  });
  const priceErr = negativeServicePrice.validateSync();
  assert('Worker Profile: Negative sub-service price rejected', !!priceErr);

  logger.info(`--- Result: ${passed}/${total} Worker System Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runWorkerTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runWorkerTests;
