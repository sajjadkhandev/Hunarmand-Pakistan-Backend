/**
 * Review Routes
 * Endpoints for submitting, reading, and managing reviews
 */

const express = require('express');
const router = express.Router();
const {
  createReview,
  getWorkerReviews,
  getMyReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public route to view worker reviews
router.get('/worker/:workerId', getWorkerReviews);

// Protected routes
router.use(protect);

router.post('/', authorize('customer'), createReview);
router.get('/my', getMyReviews);
router.delete('/:id', deleteReview);

module.exports = router;
