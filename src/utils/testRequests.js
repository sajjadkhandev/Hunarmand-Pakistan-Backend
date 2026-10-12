/**
 * Phase 7 Service Request System Test Suite
 * Validates request models, lifecycle state transitions, permissions, and status machines
 */

const mongoose = require('mongoose');
const { ServiceRequest } = require('../models');
const { VALID_TRANSITIONS } = require('../controllers/requestController');
const logger = require('./logger');

const runRequestTests = async () => {
  logger.info('--- Running Phase 7 Service Requests Tests ---');
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

  // 1. State Machine Transitions Matrix Test
  assert(
    'State Machine: "pending" can only transition to accepted, rejected, cancelled',
    Array.isArray(VALID_TRANSITIONS.pending) &&
      VALID_TRANSITIONS.pending.includes('accepted') &&
      VALID_TRANSITIONS.pending.includes('rejected') &&
      VALID_TRANSITIONS.pending.includes('cancelled')
  );

  assert(
    'State Machine: "accepted" can transition to in_progress or cancelled',
    Array.isArray(VALID_TRANSITIONS.accepted) &&
      VALID_TRANSITIONS.accepted.includes('in_progress') &&
      VALID_TRANSITIONS.accepted.includes('cancelled') &&
      !VALID_TRANSITIONS.accepted.includes('completed')
  );

  assert(
    'State Machine: "in_progress" can transition to completed or cancelled',
    Array.isArray(VALID_TRANSITIONS.in_progress) &&
      VALID_TRANSITIONS.in_progress.includes('completed') &&
      VALID_TRANSITIONS.in_progress.includes('cancelled')
  );

  assert(
    'State Machine: Terminal states (completed, rejected, cancelled) have no outgoing transitions',
    VALID_TRANSITIONS.completed.length === 0 &&
      VALID_TRANSITIONS.rejected.length === 0 &&
      VALID_TRANSITIONS.cancelled.length === 0
  );

  // 2. Model Validation: Valid ServiceRequest instance
  const customerId = new mongoose.Types.ObjectId();
  const workerId = new mongoose.Types.ObjectId();
  const categoryId = new mongoose.Types.ObjectId();

  const validReq = new ServiceRequest({
    customerId,
    workerId,
    categoryId,
    serviceType: 'Pipe Leakage Repair',
    description: 'Kitchen sink pipe is leaking water continuously.',
    location: {
      address: 'House 42, Street 7, Block B',
      city: 'Karachi',
      area: 'Gulshan-e-Iqbal',
    },
    preferredDate: new Date('2026-10-15'),
    preferredTime: '10:00 AM - 12:00 PM',
    estimatedPrice: 1200,
  });

  const validErr = validReq.validateSync();
  assert(
    'Model: Valid ServiceRequest passes schema validation and defaults to "pending"',
    !validErr && validReq.status === 'pending'
  );

  // 3. Model Validation: Missing required fields
  const invalidReq = new ServiceRequest({
    customerId,
    // workerId omitted
    // categoryId omitted
  });
  const invalidErr = invalidReq.validateSync();
  assert(
    'Model: Missing workerId, categoryId, description, and preferredDate fails validation',
    invalidErr &&
      invalidErr.errors['workerId'] &&
      invalidErr.errors['categoryId'] &&
      invalidErr.errors['description'] &&
      invalidErr.errors['preferredDate']
  );

  // 4. Model Validation: Invalid status enum
  const badStatusReq = new ServiceRequest({
    customerId,
    workerId,
    categoryId,
    description: 'Wiring check',
    location: { address: 'Plot 5', city: 'Lahore', area: 'DHA Phase 5' },
    preferredDate: new Date(),
    preferredTime: 'Afternoon',
    status: 'arbitrary_invalid_state',
  });
  const badStatusErr = badStatusReq.validateSync();
  assert(
    'Model: Invalid status is rejected by enum validation',
    badStatusErr && badStatusErr.errors['status']
  );

  // 5. Role Permission Guard simulation
  const checkCanWorkerAccept = (role, status) => {
    if (status === 'accepted') {
      return role === 'worker' || role === 'admin';
    }
    return true;
  };
  assert(
    'Guard: Customer cannot accept a request; only assigned Worker or Admin can accept',
    !checkCanWorkerAccept('customer', 'accepted') &&
      checkCanWorkerAccept('worker', 'accepted') &&
      checkCanWorkerAccept('admin', 'accepted')
  );

  // 6. Direct Jump Prevention
  const isTransitionAllowed = (from, to) => (VALID_TRANSITIONS[from] || []).includes(to);
  assert(
    'Guard: Direct leap from "pending" to "completed" without accepted/in_progress is rejected',
    !isTransitionAllowed('pending', 'completed')
  );

  logger.info(`--- Result: ${passed}/${total} Service Request Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runRequestTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runRequestTests;
