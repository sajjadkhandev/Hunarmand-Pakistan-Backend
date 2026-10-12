/**
 * JWT Token Generation Utility
 * Generates signed JSON Web Tokens for authenticated sessions
 */

const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'hunarmand_pakistan_development_secret_key_12345';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    secret,
    {
      expiresIn: expiresIn,
    }
  );
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'hunarmand_pakistan_development_secret_key_12345';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
