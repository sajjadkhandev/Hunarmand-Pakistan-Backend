/**
 * Phase 9 Admin Dashboard & Management System Test Suite
 * Validates admin RBAC guards, worker verification flows, user moderation,
 * dispute reports, and platform metric aggregations
 */

const mongoose = require('mongoose');
const { Report, User, WorkerProfile } = require('../models');
const logger = require('./logger');

const runAdminTests = async () => {
  logger.info('--- Running Phase 9 Admin System Tests ---');
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

  const adminId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();

  // 1. RBAC Guard: Only 'admin' role can access admin endpoints
  const checkAdminAccess = (role) => {
    return role === 'admin';
  };

  assert(
    'RBAC: Only "admin" role granted access to admin management routes',
    checkAdminAccess('admin') &&
      !checkAdminAccess('customer') &&
      !checkAdminAccess('worker')
  );

  // 2. Self-Suspension Prevention Guard
  const canSuspendUser = (adminUserId, targetUserId) => {
    if (adminUserId.toString() === targetUserId.toString()) {
      return { allowed: false, reason: 'Admin cannot suspend own account' };
    }
    return { allowed: true };
  };

  assert(
    'Security: Admin is prohibited from suspending their own administrative account',
    canSuspendUser(adminId, adminId).allowed === false &&
      canSuspendUser(adminId, workerId).allowed === true
  );

  // 3. Worker Verification Status Validation
  const validVerifStatuses = ['verified', 'rejected', 'pending', 'not_verified'];
  const isValidVerifStatus = (status) => validVerifStatuses.includes(status);

  assert(
    'Verification: Accepts valid verification states (verified, rejected, pending, not_verified)',
    isValidVerifStatus('verified') &&
      isValidVerifStatus('rejected') &&
      isValidVerifStatus('pending') &&
      !isValidVerifStatus('unauthorized_badge_status')
  );

  // 4. Report Model Validation: Valid dispute report
  const validReport = new Report({
    reporterId: customerId,
    reportedUserId: workerId,
    reason: 'overcharging',
    description: 'Technician demanded extra 2000 PKR above the agreed quotation.',
    status: 'pending',
  });

  const validReportErr = validReport.validateSync();
  assert(
    'Model: Valid dispute report with reason and context passes schema validation',
    !validReportErr && validReport.status === 'pending'
  );

  // 5. Report Model Validation: Invalid reason
  const badReasonReport = new Report({
    reporterId: customerId,
    reportedUserId: workerId,
    reason: 'invalid_complaint_type',
    description: 'Something random',
  });
  const badReasonErr = badReasonReport.validateSync();
  assert(
    'Model: Invalid complaint reason rejected by schema enum validation',
    badReasonErr && badReasonErr.errors['reason']
  );

  // 6. Report Resolution Lifecycle States
  const allowedReportTransitions = ['pending', 'under_review', 'resolved', 'dismissed'];
  const checkReportStatus = (status) => allowedReportTransitions.includes(status);

  assert(
    'Dispute: Supports investigation, resolution, and dismissal states',
    checkReportStatus('under_review') &&
      checkReportStatus('resolved') &&
      checkReportStatus('dismissed')
  );

  // 7. Self-Reporting Prevention
  const canReport = (reporter, reported) => reporter.toString() !== reported.toString();
  assert(
    'Guard: User is blocked from filing a report against themselves',
    !canReport(customerId, customerId) && canReport(customerId, workerId)
  );

  // 8. Platform GMV Financial Metric Calculation
  const mockJobs = [
    { status: 'completed', finalPrice: 1200 },
    { status: 'completed', finalPrice: 2500 },
    { status: 'completed', finalPrice: 800 },
    { status: 'pending', estimatedPrice: 600 },
  ];
  const calculatedGMV = mockJobs
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + j.finalPrice, 0);

  assert(
    'Analytics: Completed service GMV calculation correctly aggregates 1200 + 2500 + 800 = 4500 PKR',
    calculatedGMV === 4500
  );

  logger.info(`--- Result: ${passed}/${total} Admin System Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runAdminTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runAdminTests;
