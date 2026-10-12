/**
 * Worker Routes
 * Endpoints for worker directory, worker profile management, and availability
 */

const express = require('express');
const router = express.Router();
const {
  getMyWorkerProfile,
  upsertWorkerProfile,
  updateAvailability,
  getWorkers,
  getWorkerById,
} = require('../controllers/workerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getWorkers);

// Worker protected routes (must be declared before /:id to prevent matching /profile/me as an ID)
router.get('/profile/me', protect, authorize('worker'), getMyWorkerProfile);
router.post('/profile', protect, authorize('worker'), upsertWorkerProfile);
router.patch('/profile', protect, authorize('worker'), upsertWorkerProfile);
router.patch('/availability', protect, authorize('worker'), updateAvailability);

// Public single worker route
router.get('/:id', getWorkerById);

module.exports = router;
