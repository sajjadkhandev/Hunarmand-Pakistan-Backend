/**
 * Service Request Controller
 * Manages the hiring workflow, service request state transitions, and user dashboards
 */

const { ServiceRequest, User, WorkerProfile, Category } = require('../models');
const logger = require('../utils/logger');

// Allowed status lifecycle transitions
const VALID_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  rejected: [],  // Terminal state
  cancelled: [], // Terminal state
};

// @desc    Create a new service request
// @route   POST /api/requests
// @access  Private (Customer)
const createServiceRequest = async (req, res, next) => {
  try {
    const {
      workerId,
      categoryId,
      serviceType,
      description,
      location,
      preferredDate,
      preferredTime,
      estimatedPrice,
    } = req.body;

    // 1. Validation
    if (!workerId || !categoryId || !description || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: worker, category, description, date, and time.',
      });
    }

    if (!location || !location.address || !location.city || !location.area) {
      return res.status(400).json({
        success: false,
        message: 'Complete service address (address, city, area) is required.',
      });
    }

    // Ensure customer does not request themselves
    if (req.user._id.toString() === workerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a service request to yourself.',
      });
    }

    // Verify worker exists and is active
    const workerUser = await User.findById(workerId);
    if (!workerUser || workerUser.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found or account is not a skilled worker.',
      });
    }

    // Create Service Request
    const serviceRequest = await ServiceRequest.create({
      customerId: req.user._id,
      workerId,
      categoryId,
      serviceType: serviceType || 'General Service',
      description,
      location: {
        address: location.address,
        city: location.city,
        area: location.area,
      },
      preferredDate: new Date(preferredDate),
      preferredTime,
      estimatedPrice: estimatedPrice || undefined,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: req.user._id,
          note: 'Request created by customer',
          timestamp: new Date(),
        },
      ],
    });

    logger.success(`Service request created: ${serviceRequest._id} by Customer ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: 'Service request sent successfully! The worker will review it shortly.',
      request: serviceRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's requests (Customer or Worker)
// @route   GET /api/requests/my
// @access  Private
const getMyRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'worker') {
      query.workerId = req.user._id;
    } else {
      // Admin sees all
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await ServiceRequest.find(query)
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

// @desc    Get single request by ID
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name email phone city area profileImage')
      .populate('workerId', 'name email phone city area profileImage')
      .populate('categoryId', 'name slug icon');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found.',
      });
    }

    // Security check: Must be the customer, the worker, or an admin
    const isCustomer = request.customerId._id.toString() === req.user._id.toString();
    const isWorker = request.workerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this request.',
      });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update request status (Accept, Reject, In Progress, Complete, Cancel)
// @route   PATCH /api/requests/:id/status
// @access  Private
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, note, finalPrice } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New status is required.',
      });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found.',
      });
    }

    const currentStatus = request.status;
    const isCustomer = request.customerId.toString() === req.user._id.toString();
    const isWorker = request.workerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a party to this service request.',
      });
    }

    // Validate allowed status transition
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(status) && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: Cannot change status from '${currentStatus}' to '${status}'.`,
      });
    }

    // Enforce role-based permission on specific status actions
    if (status === 'accepted' || status === 'rejected') {
      if (!isWorker && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned worker can accept or reject this request.',
        });
      }
    }

    if (status === 'in_progress' || status === 'completed') {
      if (!isWorker && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned worker can update progress or complete the job.',
        });
      }
    }

    if (status === 'cancelled') {
      if (!isCustomer && !isWorker && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the customer or worker can cancel this request.',
        });
      }
    }

    // Update request document
    request.status = status;
    if (status === 'completed') {
      request.completedAt = new Date();
      if (finalPrice) request.finalPrice = Number(finalPrice);

      // Increment completedJobsCount on WorkerProfile
      await WorkerProfile.findOneAndUpdate(
        { userId: request.workerId },
        { $inc: { completedJobsCount: 1 } }
      );
    } else if (status === 'cancelled') {
      request.cancelledAt = new Date();
    }

    // Record status history
    request.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || `Status updated to ${status}`,
      timestamp: new Date(),
    });

    await request.save();

    logger.info(`Request ${request._id} transitioned: ${currentStatus} -> ${status} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: `Service request status updated to '${status}'.`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createServiceRequest,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  VALID_TRANSITIONS,
};
