/**
 * Database Configuration & Connection
 * Connects to MongoDB using Mongoose with resilient retry handling and standard cloud fallback
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

let lastDbError = null;

const connectDB = async (retryCount = 0) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    lastDbError = 'MONGODB_URI environment variable is required.';
    logger.error(`MongoDB Connection Error: ${lastDbError}`);
    return null;
  }

  try {
     await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    lastDbError = error.message;
    logger.error(`MongoDB Connection Error: ${error.message}`);

    // If primary URI failed, try fallback URI on next retry
    if (retryCount < 3) {
      logger.info(`Retrying MongoDB connection in 2s with standard replica set URI (Attempt ${retryCount + 1}/3)...`);
      await new Promise((res) => setTimeout(res, 2000));
      return connectDB(retryCount + 1);
    }
    return null;
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Reconnecting...');
  connectDB();
});

mongoose.connection.on('reconnected', () => {
  lastDbError = null;
  logger.info('MongoDB reconnected successfully.');
});

const getLastDbError = () => lastDbError;

module.exports = connectDB;
module.exports.getLastDbError = getLastDbError;
