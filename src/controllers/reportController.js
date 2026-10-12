/**
 * Report Controller
 * Handles misconduct reports and dispute submissions from customers or workers
 */

const { Report, User, ServiceRequest } = require('../models');
const logger = require('../utils/logger');

// @desc    Submit a new dispute or misconduct report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res, next) => {
  try {
    const { reportedUserId, serviceRequestId, reason, description } = req.body;

    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reported user ID, reason, and detailed description.',
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long.',
      });
    }

    if (req.user._id.toString() === reportedUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself.',
      });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user does not exist.',
      });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reportedUserId,
      serviceRequestId: serviceRequestId || null,
      reason,
      description: description.trim(),
      status: 'pending',
    });

    logger.warn(
      `Dispute filed: User ${req.user.name} reported User ${reportedUser.name} for '${reason}'`
    );

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. Our trust & safety team will review it.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's filed reports
// @route   GET /api/reports/my
// @access  Private
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate('reportedUserId', 'name role city profileImage')
      .populate('serviceRequestId', 'serviceType status')
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

module.exports = {
  createReport,
  getMyReports,
};
