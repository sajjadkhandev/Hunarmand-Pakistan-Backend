/**
 * Category Controller
 * Handles CRUD operations and public listing for service categories
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
const { categories: defaultCategories } = require('../utils/seedCategories');
const logger = require('../utils/logger');

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    let categories = [];
    if (mongoose.connection.readyState === 1) {
      categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    }

    // Fallback if database is offline, empty, or not yet seeded
    if (!categories || categories.length === 0) {
      categories = defaultCategories.map((cat, idx) => ({
        _id: `fallback-${idx}`,
        ...cat,
        isActive: true,
      }));
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    // If DB is offline, return default categories gracefully
    logger.warn(`Could not fetch categories from DB (${error.message}), returning fallback seed categories.`);
    res.status(200).json({
      success: true,
      count: defaultCategories.length,
      categories: defaultCategories,
    });
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let category = null;
    if (mongoose.connection.readyState === 1) {
      category = await Category.findOne({ slug: slug.toLowerCase() });
    }

    if (!category) {
      // Check fallback
      const found = defaultCategories.find((c) => c.slug === slug.toLowerCase());
      if (found) category = found;
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, icon, description, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const category = await Category.create({
      name,
      icon: icon || '🔧',
      description,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PATCH /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
