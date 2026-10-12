/**
 * Model Schema Validation Test Runner
 * Validates Mongoose schema constraints, data types, and default values
 * Runs independently without requiring an active MongoDB connection.
 */

const mongoose = require('mongoose');
const {
  User,
  WorkerProfile,
  Category,
  ServiceRequest,
  Review,
  Report,
} = require('../models');
const logger = require('./logger');

const runValidationTests = () => {
  logger.info('--- Running Phase 2 Model Validation Tests ---');
  let passed = 0;
  let total = 0;

  const assertValidation = (testName, modelInstance, shouldFail = false) => {
    total++;
    const error = modelInstance.validateSync();
    if (shouldFail) {
      if (error) {
        logger.success(`[PASS] ${testName} (Correctly rejected invalid input)`);
        passed++;
      } else {
        logger.error(`[FAIL] ${testName} (Expected validation error but passed)`);
      }
    } else {
      if (!error) {
        logger.success(`[PASS] ${testName} (Valid schema accepted)`);
        passed++;
      } else {
        logger.error(`[FAIL] ${testName} (Unexpected error: ${error.message})`);
      }
    }
  };

  // 1. User Validation Tests
  const validUser = new User({
    name: 'Muhammad Tariq',
    email: 'tariq.electrician@example.com',
    password: 'securePassword123',
    phone: '03001234567',
    role: 'worker',
    city: 'Karachi',
    area: 'Gulshan-e-Iqbal',
  });
  assertValidation('User Model: Valid worker user registration', validUser);

  const invalidEmailUser = new User({
    name: 'Ali Raza',
    email: 'invalid-email-format',
    password: 'password123',
    phone: '03001234567',
    city: 'Lahore',
    area: 'DHA',
  });
  assertValidation('User Model: Invalid email address rejection', invalidEmailUser, true);

  const invalidPhoneUser = new User({
    name: 'Ali Raza',
    email: 'ali@example.com',
    password: 'password123',
    phone: '12345', // Not a Pakistani mobile format
    city: 'Lahore',
    area: 'DHA',
  });
  assertValidation('User Model: Invalid Pakistani phone format rejection', invalidPhoneUser, true);

  // 2. Category Validation Tests
  const validCategory = new Category({
    name: 'Solar Technician',
    slug: 'solar-technician',
    icon: '☀️',
    description: 'Solar panel installation & inverter setups',
  });
  assertValidation('Category Model: Valid category schema', validCategory);

  // 3. WorkerProfile Validation Tests
  const validWorkerProfile = new WorkerProfile({
    userId: new mongoose.Types.ObjectId(),
    category: validCategory._id,
    skillTitle: 'Senior Solar Inverter Specialist',
    experience: 5,
    startingPrice: 1500,
    city: 'Karachi',
    area: 'Gulshan-e-Iqbal',
    services: [
      { name: 'On-grid Net Metering Inverter Setup', price: 5000 },
      { name: 'Solar Panel Structure Fixing', price: 3000 },
    ],
  });
  assertValidation('WorkerProfile Model: Valid worker profile', validWorkerProfile);

  const negativePriceWorker = new WorkerProfile({
    userId: new mongoose.Types.ObjectId(),
    category: validCategory._id,
    experience: 5,
    startingPrice: -500, // Invalid negative price
    city: 'Karachi',
    area: 'Gulshan',
  });
  assertValidation('WorkerProfile Model: Negative starting price rejection', negativePriceWorker, true);

  // 4. ServiceRequest Validation Tests
  const validRequest = new ServiceRequest({
    customerId: new mongoose.Types.ObjectId(),
    workerId: new mongoose.Types.ObjectId(),
    categoryId: validCategory._id,
    description: 'AC is not cooling properly and making a buzzing noise from outdoor unit.',
    location: {
      address: 'House # 45, Street 8',
      city: 'Islamabad',
      area: 'F-8',
    },
    preferredDate: new Date('2026-10-15'),
    preferredTime: 'Morning (9am - 12pm)',
    status: 'pending',
  });
  assertValidation('ServiceRequest Model: Valid service booking request', validRequest);

  const shortDescRequest = new ServiceRequest({
    customerId: new mongoose.Types.ObjectId(),
    workerId: new mongoose.Types.ObjectId(),
    categoryId: validCategory._id,
    description: 'Fix it', // Too short (< 10 chars)
    location: { address: 'A', city: 'B', area: 'C' },
    preferredDate: new Date(),
    preferredTime: 'Anytime',
  });
  assertValidation('ServiceRequest Model: Description under 10 chars rejection', shortDescRequest, true);

  // 5. Review Validation Tests
  const validReview = new Review({
    customerId: new mongoose.Types.ObjectId(),
    workerId: new mongoose.Types.ObjectId(),
    serviceRequestId: validRequest._id,
    rating: 5,
    comment: 'Zabardast kaam kiya, time par pohanchay aur masla hal ho gaya.',
  });
  assertValidation('Review Model: Valid 5-star customer review', validReview);

  const invalidRatingReview = new Review({
    customerId: new mongoose.Types.ObjectId(),
    workerId: new mongoose.Types.ObjectId(),
    serviceRequestId: validRequest._id,
    rating: 7, // Exceeds max 5
    comment: 'Great job!',
  });
  assertValidation('Review Model: Out-of-bounds rating (>5) rejection', invalidRatingReview, true);

  // 6. Report Validation Tests
  const validReport = new Report({
    reporterId: new mongoose.Types.ObjectId(),
    reportedUserId: new mongoose.Types.ObjectId(),
    reason: 'overcharging',
    description: 'Agreed on 1000 PKR but demanded 3000 PKR upon job completion.',
  });
  assertValidation('Report Model: Valid misconduct report', validReport);

  logger.info(`--- Result: ${passed}/${total} Model Validation Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  const success = runValidationTests();
  process.exit(success ? 0 : 1);
}

module.exports = runValidationTests;
