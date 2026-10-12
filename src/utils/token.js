/**
 * JWT Token Generation Utility
 * Generates signed JSON Web Tokens for authenticated sessions
 */

const jwt = require('jsonwebtoken');

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required.');
  }
  return process.env.JWT_SECRET;
};

const generateToken = (userId, role) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    getSecret(),
    {
      expiresIn: expiresIn,
    }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

module.exports = {
  generateToken,
  verifyToken,
};
