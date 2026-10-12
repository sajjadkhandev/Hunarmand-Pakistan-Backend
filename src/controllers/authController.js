/**
 * Authentication Controller
 * Handles user registration, login, logout, and profile retrieval
 */

const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const { generateToken } = require('../utils/token');
const logger = require('../utils/logger');

// @desc    Register a new Customer or Skilled Worker
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, city, area, profileImage } = req.body;

    // 1. Basic validation
    if (!name || !email || !password || !phone || !city || !area) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, phone, city, and area.',
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please login instead.',
      });
    }

    // 3. Create user
    const selectedRole = ['customer', 'worker'].includes(role) ? role : 'customer';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: selectedRole,
      city,
      area,
      ...(profileImage ? { profileImage } : {}),
    });

    // 4. Generate JWT Token
    const token = generateToken(user._id, user.role);

    logger.success(`New user registered: ${user.name} (${user.email}) as [${user.role}]`);

    // 5. Response payload (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      city: user.city,
      area: user.area,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: `${user.role === 'worker' ? 'Skilled Worker' : 'Customer'} registered successfully!`,
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Explicitly select password since it has select: false in schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account active state
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact support.',
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    logger.info(`User logged in: ${user.name} [${user.role}]`);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      city: user.city,
      area: user.area,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (Requires JWT)
const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    let workerProfile = null;
    if (user.role === 'worker') {
      workerProfile = await WorkerProfile.findOne({ userId: user._id }).populate('category');
    }

    res.status(200).json({
      success: true,
      user,
      workerProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear session confirmation
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully.',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
};
