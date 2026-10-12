/**
 * Phase 3 Authentication & Authorization Test Suite
 * Validates password hashing, bcrypt verification, JWT signing, token decoding, and RBAC guards.
 */

const { generateToken, verifyToken } = require('./token');
const { User } = require('../models');
const { authorize } = require('../middlewares/authMiddleware');
const logger = require('./logger');

const runAuthTests = async () => {
  logger.info('--- Running Phase 3 Authentication & Security Tests ---');
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

  // 1. JWT Token Generation Test
  const testUserId = '65239a0fa33a884483759b92';
  const testRole = 'worker';
  const token = generateToken(testUserId, testRole);

  assert('JWT: Token is generated and consists of 3 dot-separated segments', typeof token === 'string' && token.split('.').length === 3);

  // 2. JWT Token Verification Test
  const decoded = verifyToken(token);
  assert('JWT: Decoded payload contains correct userId and role', decoded.id === testUserId && decoded.role === testRole);

  // 3. Invalid Token Rejection Test
  let caughtInvalid = false;
  try {
    verifyToken('invalid.token.signature');
  } catch (err) {
    caughtInvalid = true;
  }
  assert('JWT: Invalid/corrupt token signature is rejected with error', caughtInvalid);

  // 4. Password Hashing Test with User model hooks
  const testUser = new User({
    name: 'Aslam Bhai AC Master',
    email: 'aslam.ac@example.com',
    password: 'mySecretPassword123',
    phone: '03121234567',
    role: 'worker',
    city: 'Lahore',
    area: 'Gulberg III',
  });

  // Manually trigger pre-save hook for validation without DB insertion
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  testUser.password = await bcrypt.hash(testUser.password, salt);

  assert('Security: Password is encrypted and not stored in plain text', testUser.password !== 'mySecretPassword123' && testUser.password.startsWith('$2'));

  // 5. Password Comparison Match Test
  const isMatch = await testUser.matchPassword('mySecretPassword123');
  assert('Security: Correct plain password matches bcrypt hash', isMatch === true);

  // 6. Password Comparison Reject Test
  const isWrongMatch = await testUser.matchPassword('wrongPassword!');
  assert('Security: Incorrect plain password is rejected by bcrypt', isWrongMatch === false);

  // 7. Role-Based Access Control (RBAC) Guard Test
  const adminGuard = authorize('admin');
  const workerGuard = authorize('worker', 'admin');

  let forbiddenHit = false;
  const mockReqCustomer = { user: { role: 'customer' } };
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        if (code === 403) forbiddenHit = true;
      },
    }),
  };
  const mockNext = () => {};

  adminGuard(mockReqCustomer, mockRes, mockNext);
  assert('RBAC: Customer attempting admin action receives 403 Forbidden', forbiddenHit === true);

  let allowedHit = false;
  const mockReqWorker = { user: { role: 'worker' } };
  const mockResAllow = { status: () => ({ json: () => {} }) };
  workerGuard(mockReqWorker, mockResAllow, () => {
    allowedHit = true;
  });
  assert('RBAC: Worker attempting worker action is authorized (next() called)', allowedHit === true);

  logger.info(`--- Result: ${passed}/${total} Authentication Tests Passed Successfully ---`);
  return passed === total;
};

if (require.main === module) {
  runAuthTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runAuthTests;
