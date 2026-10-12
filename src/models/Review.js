/**
 * Review Model
 * Stores ratings and feedback from customers for completed services
 * Automatically calculates and updates the WorkerProfile average rating
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: [true, 'Service Request ID is required'],
      unique: true, // Prevents duplicate reviews for the same completed job
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5 stars'],
      min: [1, 'Minimum rating is 1 star'],
      max: [5, 'Maximum rating is 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Please write your feedback/review'],
      trim: true,
      minlength: [5, 'Comment must be at least 5 characters long'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Static method to recalculate average rating for a worker
reviewSchema.statics.calculateAverageRating = async function (workerId) {
  const stats = await this.aggregate([
    { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
    {
      $group: {
        _id: '$workerId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const WorkerProfile = mongoose.model('WorkerProfile');

  if (stats.length > 0) {
    await WorkerProfile.findOneAndUpdate(
      { userId: workerId },
      {
        averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place (e.g., 4.8)
        totalReviews: stats[0].totalReviews,
      }
    );
  } else {
    await WorkerProfile.findOneAndUpdate(
      { userId: workerId },
      {
        averageRating: 0,
        totalReviews: 0,
      }
    );
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.workerId);
});

// Call calculateAverageRating after remove/delete
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.workerId);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
