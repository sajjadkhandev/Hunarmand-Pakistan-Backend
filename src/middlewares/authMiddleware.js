/**
 * Authentication & Authorization Middleware
 * Protects private routes and enforces role-based access control (RBAC)
 */

const { verifyToken } = require('../utils/token');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware to ensure request has a valid JWT Bearer token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      // Fetch user without password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed: User no longer exists.',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account suspended: Please contact Hunarmand Pakistan support.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      logger.warn(`JWT verification error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please login again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided.',
    });
  }
};

// Middleware to enforce role-based access control (e.g. authorize('admin', 'worker'))
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
