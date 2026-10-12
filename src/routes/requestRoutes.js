/**
 * Service Request Routes
 * Endpoints for service booking, request tracking, and status transitions
 */

const express = require('express');
const router = express.Router();
const {
  createServiceRequest,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
} = require('../controllers/requestController');
const { protect } = require('../middlewares/authMiddleware');

// All request routes require authentication
router.use(protect);

router.post('/', createServiceRequest);
router.get('/my', getMyRequests);
router.get('/:id', getRequestById);
router.patch('/:id/status', updateRequestStatus);

module.exports = router;
