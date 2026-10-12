/**
 * ServiceRequest Model
 * Manages booking workflow between Customer and Skilled Worker
 */

const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker ID is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
      index: true,
    },
    serviceType: {
      type: String,
      trim: true,
      default: 'General Service',
    },
    description: {
      type: String,
      required: [true, 'Please explain the issue or work required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Service address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      area: {
        type: String,
        required: [true, 'Area is required'],
        trim: true,
      },
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred service date is required'],
    },
    preferredTime: {
      type: String,
      required: [true, 'Preferred time slot is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
        message: 'Status must be pending, accepted, rejected, in_progress, completed, or cancelled',
      },
      default: 'pending',
      index: true,
    },
    estimatedPrice: {
      type: Number,
      min: [0, 'Estimated price cannot be negative'],
    },
    finalPrice: {
      type: Number,
      min: [0, 'Final price cannot be negative'],
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    workerNotes: {
      type: String,
      trim: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup on dashboards
serviceRequestSchema.index({ customerId: 1, status: 1 });
serviceRequestSchema.index({ workerId: 1, status: 1 });
serviceRequestSchema.index({ createdAt: -1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest;
