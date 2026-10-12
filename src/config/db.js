/**
 * Database Configuration & Connection
 * Connects to MongoDB using Mongoose with resilient retry handling and standard cloud fallback
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Direct Standard URI bypasses Render SRV DNS lookups
const ATLAS_STANDARD_URI =
  'mongodb://sajjadwazir4459_db_user:3kUhO3Uop3PJg1Jw@ac-6ywq50y-shard-00-00.3yoiu8k.mongodb.net:27017,ac-6ywq50y-shard-00-01.3yoiu8k.mongodb.net:27017,ac-6ywq50y-shard-00-02.3yoiu8k.mongodb.net:27017/test?ssl=true&authSource=admin&retryWrites=true&w=majority';

const ATLAS_SRV_URI =
  'mongodb+srv://sajjadwazir4459_db_user:3kUhO3Uop3PJg1Jw@cluster0.3yoiu8k.mongodb.net/test?retryWrites=true&w=majority';

let lastDbError = null;

const connectDB = async (retryCount = 0) => {
  // Use standard replica set URI if MONGODB_URI is not set or failed
  const uri = process.env.MONGODB_URI || ATLAS_STANDARD_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    lastDbError = null;
    logger.success(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
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
