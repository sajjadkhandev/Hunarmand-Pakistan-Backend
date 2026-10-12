/**
 * WorkerProfile Model
 * Extended profile for registered skilled workers (Hunarmand)
 */

const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const workerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker profile must belong to a User'],
      unique: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a primary skill category'],
      index: true,
    },
    skillTitle: {
      type: String,
      trim: true,
      default: 'Skilled Technician',
    },
    experience: {
      type: Number,
      required: [true, 'Please enter years of experience'],
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience cannot exceed 60 years'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      default: 'Professional and reliable technician dedicated to providing high quality work.',
    },
    services: {
      type: [serviceItemSchema],
      default: [],
    },
    startingPrice: {
      type: Number,
      required: [true, 'Please provide starting service price in PKR'],
      min: [0, 'Starting price cannot be negative'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    workingHours: {
      type: String,
      default: '9:00 AM - 7:00 PM',
      trim: true,
    },
    availability: {
      type: String,
      enum: {
        values: ['available', 'busy', 'offline'],
        message: 'Availability must be either available, busy, or offline',
      },
      default: 'available',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['not_verified', 'pending', 'verified', 'rejected'],
        message: 'Status must be not_verified, pending, verified, or rejected',
      },
      default: 'not_verified',
      index: true,
    },
    cnicNumber: {
      type: String,
      trim: true,
      match: [
        /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/,
        'Please enter a valid Pakistani CNIC format (e.g. 12345-1234567-1)',
      ],
      select: false, // Protected field for admin verification only
    },
    portfolioImages: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      index: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedJobsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & filtering workers efficiently
workerProfileSchema.index({ city: 1, category: 1, availability: 1 });
workerProfileSchema.index({ city: 1, verificationStatus: 1, averageRating: -1 });

const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema);

module.exports = WorkerProfile;
