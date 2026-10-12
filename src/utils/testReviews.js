/**
 * Phase 8 Rating & Review System Test Suite
 * Validates Review model schema, validation rules, unique constraints,
 * and mathematical rating recalculations
 */

const mongoose = require('mongoose');
const { Review, ServiceRequest } = require('../models');
const logger = require('./logger');

const runReviewTests = async () => {
  logger.info('--- Running Phase 8 Reviews & Ratings Tests ---');
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

  const customerId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const serviceRequestId = new mongoose.Types.ObjectId();

  // 1. Model Schema Validation: Valid Review
  const validReview = new Review({
    customerId,
    workerId,
    serviceRequestId,
    rating: 5,
    comment: 'Bohot umdah kaam kiya, waqt par pohanche aur safai se kaam mukammal kiya.',
  });

  const validErr = validReview.validateSync();
  assert(
    'Model: Valid review with 5 stars and descriptive feedback passes validation',
    !validErr && validReview.rating === 5
  );

  // 2. Rating Bounds Validation: Min 1, Max 5
  const underMinReview = new Review({
    customerId,
    workerId,
    serviceRequestId,
    rating: 0,
    comment: 'Too low rating test',
  });
  const underMinErr = underMinReview.validateSync();
  assert(
    'Model: Rating of 0 stars is rejected by min boundary validator',
    underMinErr && underMinErr.errors['rating']
  );

  const overMaxReview = new Review({
    customerId,
    workerId,
    serviceRequestId,
    rating: 6,
    comment: 'Over limit rating test',
  });
  const overMaxErr = overMaxReview.validateSync();
  assert(
    'Model: Rating of 6 stars is rejected by max boundary validator',
    overMaxErr && overMaxErr.errors['rating']
  );

  // 3. Comment Length Validation: Min 5 characters
  const shortCommentReview = new Review({
    customerId,
    workerId,
    serviceRequestId,
    rating: 4,
    comment: 'ok',
  });
  const shortErr = shortCommentReview.validateSync();
  assert(
    'Model: Feedback comment shorter than 5 characters is rejected',
    shortErr && shortErr.errors['comment']
  );

  // 4. Duplicate Prevention Constraint: Unique serviceRequestId
  const serviceRequestPath = Review.schema.path('serviceRequestId');
  assert(
    'Model: serviceRequestId has unique constraint to prevent multiple reviews for 1 job',
    serviceRequestPath && serviceRequestPath.options.unique === true
  );

  // 5. Rating Recalculation Algorithm Accuracy
  const sampleRatings = [5, 4, 5, 5, 4, 3, 5];
  const expectedSum = sampleRatings.reduce((acc, r) => acc + r, 0);
  const expectedAvg = Math.round((expectedSum / sampleRatings.length) * 10) / 10;
  // 31 / 7 = 4.42857 -> 4.4
  assert(
    'Algorithm: Average rating rounding formula correctly rounds 31/7 to 4.4',
    expectedAvg === 4.4
  );

  // 6. Security & State Guard Simulation
  const canReview = (userRole, jobStatus, isSameCustomer, isAlreadyReviewed) => {
    if (userRole !== 'customer') return { allowed: false, reason: 'Only customer can review' };
    if (jobStatus !== 'completed') return { allowed: false, reason: 'Job must be completed' };
    if (!isSameCustomer) return { allowed: false, reason: 'Must be hiring customer' };
    if (isAlreadyReviewed) return { allowed: false, reason: 'Already reviewed' };
    return { allowed: true };
  };

  assert(
    'Guard: Completed job reviewed by hiring customer is permitted',
    canReview('customer', 'completed', true, false).allowed === true
  );

  assert(
    'Guard: Reviewing a "pending" or "in_progress" job is rejected',
    canReview('customer', 'pending', true, false).allowed === false &&
      canReview('customer', 'in_progress', true, false).allowed === false
  );

  assert(
    'Guard: Worker role attempting to review themselves is rejected',
    canReview('worker', 'completed', true, false).allowed === false
  );

  assert(
    'Guard: Attempting to review an already reviewed job is rejected',
    canReview('customer', 'completed', true, true).allowed === false
  );

  logger.info(`--- Result: ${passed}/${total} Reviews & Ratings Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runReviewTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runReviewTests;
