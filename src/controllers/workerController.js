/**
 * Worker Controller
 * Manages skilled worker profiles, services catalog, availability status, and public discovery
 */

const mongoose = require('mongoose');
const { User, WorkerProfile, Category, Review } = require('../models');
const sampleWorkers = require('../utils/sampleWorkers');
const logger = require('../utils/logger');

// @desc    Get current logged-in worker's profile
// @route   GET /api/workers/profile/me
// @access  Private (Worker)
const getMyWorkerProfile = async (req, res, next) => {
  try {
    const workerProfile = await WorkerProfile.findOne({ userId: req.user._id }).populate('category');

    if (!workerProfile) {
      return res.status(200).json({
        success: true,
        hasProfile: false,
        message: 'No worker profile created yet. Please complete your profile.',
        user: req.user,
        profile: null,
      });
    }

    res.status(200).json({
      success: true,
      hasProfile: true,
      user: req.user,
      profile: workerProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update logged-in worker's profile
// @route   POST or PATCH /api/workers/profile
// @access  Private (Worker)
const upsertWorkerProfile = async (req, res, next) => {
  try {
    const {
      categoryId,
      skillTitle,
      experience,
      bio,
      services,
      startingPrice,
      city,
      area,
      workingHours,
      cnicNumber,
      portfolioImages,
      profileImage,
    } = req.body;

    const workerCity = city || req.user.city;
    const workerArea = area || req.user.area;

    // Validate category existence if provided
    if (categoryId) {
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected category does not exist.',
        });
      }
    }

    const profileFields = {
      userId: req.user._id,
      city: workerCity,
      area: workerArea,
    };

    if (categoryId) profileFields.category = categoryId;
    if (skillTitle) profileFields.skillTitle = skillTitle;
    if (experience !== undefined) profileFields.experience = Number(experience);
    if (bio) profileFields.bio = bio;
    if (startingPrice !== undefined) profileFields.startingPrice = Number(startingPrice);
    if (workingHours) profileFields.workingHours = workingHours;
    if (cnicNumber) {
      profileFields.cnicNumber = cnicNumber;
      profileFields.verificationStatus = 'pending'; // When CNIC is submitted, set status to pending review
    }
    if (Array.isArray(services)) profileFields.services = services;
    if (Array.isArray(portfolioImages)) profileFields.portfolioImages = portfolioImages;

    // Also sync profileImage, city, or area on User model if changed
    if (profileImage || city || area) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(profileImage && { profileImage }),
        ...(city && { city }),
        ...(area && { area }),
      });
    }

    let workerProfile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    ).populate('category');

    logger.success(`Worker profile updated for user: ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: 'Worker profile updated successfully.',
      profile: workerProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update worker availability status
// @route   PATCH /api/workers/availability
// @access  Private (Worker)
const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability status. Must be available, busy, or offline.',
      });
    }

    const workerProfile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { availability } },
      { new: true }
    );

    if (!workerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found. Please create your profile first.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Availability updated to ${availability}.`,
      availability: workerProfile.availability,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workers with search & filters
// @route   GET /api/workers
// @access  Public
const getWorkers = async (req, res, next) => {
  try {
    const {
      category,
      city,
      area,
      availability,
      verified,
      minRating,
      minExp,
      maxPrice,
      keyword,
      sort,
    } = req.query;

    const filter = {};

    // 1. City filter
    if (city && city !== 'All Cities' && city !== 'all') {
      filter.city = new RegExp(`^${city}$`, 'i');
    }

    // 2. Area filter
    if (area) {
      filter.area = new RegExp(area, 'i');
    }

    let workers = [];
    if (mongoose.connection.readyState === 1) {
      // 3. Category filter
      if (category && category !== 'All Skills' && category !== 'all') {
        const cat = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: new RegExp(category, 'i') }],
        });
        if (cat) {
          filter.category = cat._id;
        }
      }

      // 4. Availability filter
      if (availability && ['available', 'busy', 'offline'].includes(availability)) {
        filter.availability = availability;
      }

      // 5. Verification status filter
      if (verified === 'true') {
        filter.verificationStatus = 'verified';
      }

      // 6. Rating filter
      if (minRating) {
        filter.averageRating = { $gte: Number(minRating) };
      }

      // 7. Experience filter
      if (minExp) {
        filter.experience = { $gte: Number(minExp) };
      }

      // 8. Max starting price filter
      if (maxPrice) {
        filter.startingPrice = { $lte: Number(maxPrice) };
      }

      // Sorting logic
      let sortQuery = { averageRating: -1, completedJobsCount: -1 };
      if (sort === 'price_asc') sortQuery = { startingPrice: 1 };
      else if (sort === 'price_desc') sortQuery = { startingPrice: -1 };
      else if (sort === 'exp_desc') sortQuery = { experience: -1 };

      try {
        workers = await WorkerProfile.find(filter)
          .populate('userId', 'name email phone city area profileImage')
          .populate('category', 'name slug icon')
          .sort(sortQuery);
      } catch (dbErr) {
        logger.warn(`Could not query database directly: ${dbErr.message}`);
      }
    }

    // Fallback if no database workers exist yet: use sampleWorkers
    if (!workers || workers.length === 0) {
      let filteredSamples = [...sampleWorkers];

      if (city && city !== 'All Cities' && city !== 'all') {
        filteredSamples = filteredSamples.filter((w) => w.city.toLowerCase() === city.toLowerCase());
      }
      if (area) {
        filteredSamples = filteredSamples.filter((w) => w.area.toLowerCase().includes(area.toLowerCase()));
      }
      if (category && category !== 'All Skills' && category !== 'all') {
        filteredSamples = filteredSamples.filter(
          (w) => w.category?.slug === category.toLowerCase() || w.category?.name.toLowerCase() === category.toLowerCase()
        );
      }
      if (availability && availability !== 'all') {
        filteredSamples = filteredSamples.filter((w) => w.availability === availability);
      }
      if (verified === 'true') {
        filteredSamples = filteredSamples.filter((w) => w.verificationStatus === 'verified');
      }
      if (minRating) {
        filteredSamples = filteredSamples.filter((w) => w.averageRating >= Number(minRating));
      }
      if (minExp) {
        filteredSamples = filteredSamples.filter((w) => w.experience >= Number(minExp));
      }
      if (maxPrice) {
        filteredSamples = filteredSamples.filter((w) => w.startingPrice <= Number(maxPrice));
      }

      // Sort sample workers
      if (sort === 'price_asc') {
        filteredSamples.sort((a, b) => a.startingPrice - b.startingPrice);
      } else if (sort === 'price_desc') {
        filteredSamples.sort((a, b) => b.startingPrice - a.startingPrice);
      } else if (sort === 'exp_desc') {
        filteredSamples.sort((a, b) => b.experience - a.experience);
      } else {
        filteredSamples.sort((a, b) => b.averageRating - a.averageRating);
      }

      workers = filteredSamples;
    }

    // Keyword search filter in memory if provided
    if (keyword) {
      const term = keyword.toLowerCase();
      workers = workers.filter((w) => {
        const userName = w.userId?.name?.toLowerCase() || '';
        const skill = w.skillTitle?.toLowerCase() || '';
        const bio = w.bio?.toLowerCase() || '';
        const cityStr = w.city?.toLowerCase() || '';
        return userName.includes(term) || skill.includes(term) || bio.includes(term) || cityStr.includes(term);
      });
    }

    res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single worker profile by ID
// @route   GET /api/workers/:id
// @access  Public
const getWorkerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let worker = null;

    // Search by WorkerProfile ID or User ID if valid ObjectId
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      worker = await WorkerProfile.findById(id)
        .populate('userId', 'name email phone city area profileImage createdAt')
        .populate('category', 'name slug icon description');

      if (!worker) {
        worker = await WorkerProfile.findOne({ userId: id })
          .populate('userId', 'name email phone city area profileImage createdAt')
          .populate('category', 'name slug icon description');
      }
    }

    // Fallback to sample workers for development/benchmarks
    if (!worker) {
      const sample = sampleWorkers.find(
        (w) => w._id === id || w.userId?._id === id
      );

      if (sample) {
        const mockReviews = [
          {
            _id: 'rev-sample-1',
            rating: 5,
            comment: 'Bohot zabardast kaam kiya, waqt par pohanche aur reasonable rate charge kiya. Highly recommended!',
            customerId: { name: 'Muhammad Bilal', city: sample.city },
            createdAt: new Date(Date.now() - 86400000 * 2),
          },
          {
            _id: 'rev-sample-2',
            rating: 5,
            comment: 'Master craftsman! Clean, polite, and very professional service.',
            customerId: { name: 'Ayesha Khan', city: sample.city },
            createdAt: new Date(Date.now() - 86400000 * 5),
          },
        ];

        return res.status(200).json({
          success: true,
          worker: sample,
          reviews: mockReviews,
        });
      }
    }

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found.',
      });
    }

    // Fetch worker reviews from DB
    const reviews = await Review.find({ workerId: worker.userId._id })
      .populate('customerId', 'name profileImage city')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      worker,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyWorkerProfile,
  upsertWorkerProfile,
  updateAvailability,
  getWorkers,
  getWorkerById,
};
