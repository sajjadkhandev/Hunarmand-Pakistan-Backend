/**
 * Review & Rating Controller
 * Handles customer ratings, feedback, duplicate review prevention,
 * and automatic worker score recalculations
 */

const mongoose = require('mongoose');
const { Review, ServiceRequest, WorkerProfile, User } = require('../models');
const logger = require('../utils/logger');

// @desc    Create a new review for a completed service request
// @route   POST /api/reviews
// @access  Private (Customer only)
const createReview = async (req, res, next) => {
  try {
    const { serviceRequestId, rating, comment } = req.body;

    // 1. Validation
    if (!serviceRequestId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceRequestId, rating (1-5), and feedback comment.',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5.',
      });
    }

    if (comment.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Feedback comment must be at least 5 characters long.',
      });
    }

    // 2. Fetch and verify the ServiceRequest
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found.',
      });
    }

    // 3. Authorization: Only the customer who hired can review
    if (serviceRequest.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the customer who booked this service can submit a review.',
      });
    }

    // 4. State Verification: Service must be completed
    if (serviceRequest.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot review an uncompleted service. Current status is '${serviceRequest.status}'.`,
      });
    }

    // 5. Prevent Duplicate Reviews
    const existingReview = await Review.findOne({ serviceRequestId });
    if (existingReview || serviceRequest.isReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this service request. Duplicate reviews are not allowed.',
      });
    }

    // 6. Create Review (Triggers Review post('save') hook to recompute WorkerProfile rating)
    const review = await Review.create({
      customerId: req.user._id,
      workerId: serviceRequest.workerId,
      serviceRequestId: serviceRequest._id,
      rating: numRating,
      comment: comment.trim(),
    });

    // 7. Update ServiceRequest record
    serviceRequest.isReviewed = true;
    serviceRequest.reviewId = review._id;
    await serviceRequest.save();

    // 8. Populate customer info for immediate response
    await review.populate('customerId', 'name city area profileImage');

    logger.success(
      `Review created: ${numRating} stars by Customer ${req.user.name} for Worker ${serviceRequest.workerId}`
    );

    res.status(201).json({
      success: true,
      message: 'Review and rating submitted successfully! Shukriya.',
      review,
    });
  } catch (error) {
    // Handle MongoDB unique index violation gracefully
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A review for this service request already exists.',
      });
    }
    next(error);
  }
};

// @desc    Get all reviews for a specific worker
// @route   GET /api/reviews/worker/:workerId
// @access  Public
const getWorkerReviews = async (req, res, next) => {
  try {
    const { workerId } = req.params;

    // Check if workerId is an ObjectId or search by WorkerProfile
    let targetWorkerUserId = workerId;

    if (mongoose.Types.ObjectId.isValid(workerId)) {
      // Check if it's a WorkerProfile ID
      const profile = await WorkerProfile.findById(workerId);
      if (profile) {
        targetWorkerUserId = profile.userId;
      }
    }

    const reviews = await Review.find({ workerId: targetWorkerUserId })
      .populate('customerId', 'name city area profileImage')
      .populate('serviceRequestId', 'serviceType completedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's reviews (Written by customer or received by worker)
// @route   GET /api/reviews/my
// @access  Private
const getMyReviews = async (req, res, next) => {
  try {
    let reviews = [];

    if (req.user.role === 'customer') {
      reviews = await Review.find({ customerId: req.user._id })
        .populate('workerId', 'name city area profileImage')
        .populate('serviceRequestId', 'serviceType completedAt')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'worker') {
      reviews = await Review.find({ workerId: req.user._id })
        .populate('customerId', 'name city area profileImage')
        .populate('serviceRequestId', 'serviceType completedAt')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review (Customer author or Admin)
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    const isAuthor = review.customerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own reviews.',
      });
    }

    // Also update associated ServiceRequest
    await ServiceRequest.findByIdAndUpdate(review.serviceRequestId, {
      isReviewed: false,
      $unset: { reviewId: 1 },
    });

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully and worker rating recomputed.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getWorkerReviews,
  getMyReviews,
  deleteReview,
};
