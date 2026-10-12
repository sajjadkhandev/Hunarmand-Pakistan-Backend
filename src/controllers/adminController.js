/**
 * Admin Controller
 * High-privilege platform operations: metrics, verification, user moderation,
 * service requests oversight, and complaints resolution
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
const logger = require('../utils/logger');

// @desc    Get platform overview statistics & analytics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalWorkers,
      verifiedWorkers,
      pendingVerifications,
      totalRequests,
      completedRequests,
      pendingRequests,
      totalReviews,
      totalCategories,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'worker' }),
      WorkerProfile.countDocuments({ verificationStatus: 'verified' }),
      WorkerProfile.countDocuments({ verificationStatus: 'pending' }),
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'completed' }),
      ServiceRequest.countDocuments({ status: 'pending' }),
      Review.countDocuments(),
      Category.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
    ]);

    // Financial calculations (estimated GMV of completed jobs)
    const completedJobsAggregate = await ServiceRequest.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalGMV: { $sum: '$finalPrice' } } },
    ]);

    const estimatedGMV = completedJobsAggregate[0]?.totalGMV || 0;

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          workers: totalWorkers,
        },
        workers: {
          total: totalWorkers,
          verified: verifiedWorkers,
          pendingVerification: pendingVerifications,
        },
        requests: {
          total: totalRequests,
          completed: completedRequests,
          pending: pendingRequests,
          estimatedGMV,
        },
        reviews: {
          total: totalReviews,
        },
        categories: {
          total: totalCategories,
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filtering and search
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (isActive !== undefined && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('workerProfile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle or set user active/suspended status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent admin from suspending their own account
    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own administrative account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.isActive = isActive !== undefined ? Boolean(isActive) : !user.isActive;
    await user.save();

    logger.info(
      `User ${user.name} (${user.email}) status updated to: ${user.isActive ? 'Active' : 'Suspended'} by Admin ${req.user.name}`
    );

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'suspended'}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workers with verification records and CNIC
// @route   GET /api/admin/workers
// @access  Private (Admin)
const getAllWorkers = async (req, res, next) => {
  try {
    const { verificationStatus, city, search } = req.query;
    const filter = {};

    if (verificationStatus && verificationStatus !== 'all') {
      filter.verificationStatus = verificationStatus;
    }

    if (city && city !== 'all') {
      filter.city = new RegExp(city, 'i');
    }

    const workers = await WorkerProfile.find(filter)
      .select('+cnicNumber') // Admin authorized to inspect CNIC for verification
      .populate('userId', 'name email phone city area profileImage isActive createdAt')
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject worker verification (CNIC check)
// @route   PATCH /api/admin/workers/:id/verify
// @access  Private (Admin)
const verifyWorker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus, reason } = req.body;

    if (!['verified', 'rejected', 'pending', 'not_verified'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status. Must be verified, rejected, pending, or not_verified.',
      });
    }

    let worker = await WorkerProfile.findById(id).select('+cnicNumber');
    if (!worker) {
      worker = await WorkerProfile.findOne({ userId: id }).select('+cnicNumber');
    }

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found.',
      });
    }

    worker.verificationStatus = verificationStatus;
    await worker.save();

    logger.success(
      `Worker ${worker.userId} verification updated to '${verificationStatus}' by Admin ${req.user.name}`
    );

    res.status(200).json({
      success: true,
      message: `Worker verification status updated to '${verificationStatus}'.`,
      worker,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all service requests across the platform
// @route   GET /api/admin/requests
// @access  Private (Admin)
const getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const requests = await ServiceRequest.find(filter)
      .populate('customerId', 'name email phone city area profileImage')
      .populate('workerId', 'name email phone city area profileImage')
      .populate('categoryId', 'name slug icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customer/worker misconduct reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getAllReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reporterId', 'name email phone role city profileImage')
      .populate('reportedUserId', 'name email phone role city profileImage')
      .populate('serviceRequestId', 'serviceType status finalPrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report resolution status and admin notes
// @route   PATCH /api/admin/reports/:id/status
// @access  Private (Admin)
const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['under_review', 'resolved', 'dismissed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, under_review, resolved, or dismissed.',
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedAt = new Date();
    }

    await report.save();

    logger.info(`Report ${id} updated to '${status}' by Admin ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: `Report status updated to '${status}'.`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  getAllWorkers,
  verifyWorker,
  getAllRequests,
  getAllReports,
  updateReportStatus,
};
