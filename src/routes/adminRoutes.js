/**
 * Admin Routes
 * High privilege administrative endpoints protected by JWT and role='admin'
 */

const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  getAllWorkers,
  verifyWorker,
  getAllRequests,
  getAllReports,
  updateReportStatus,
} = require('../controllers/adminController');
const {
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Platform Analytics & Metrics
router.get('/stats', getAdminStats);

// User Management & Moderation
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);

// Worker Verification Hub
router.get('/workers', getAllWorkers);
router.patch('/workers/:id/verify', verifyWorker);

// Category Management
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Service Requests Oversight
router.get('/requests', getAllRequests);

// Reports & Disputes Resolution
router.get('/reports', getAllReports);
router.patch('/reports/:id/status', updateReportStatus);

module.exports = router;
