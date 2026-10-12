/**
 * Database Configuration & Connection
 * Connects to MongoDB using Mongoose with resilient retry handling
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const ATLAS_URI = 'mongodb+srv://sajjadwazir4459_db_user:3kUhO3Uop3PJg1Jw@cluster0.3yoiu8k.mongodb.net/?appName=Cluster0';

const connectDB = async (retryCount = 0) => {
  const uri = process.env.MONGODB_URI || ATLAS_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    logger.success(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    if (retryCount < 3) {
      logger.info(`Retrying MongoDB connection in 2s (Attempt ${retryCount + 1}/3)...`);
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
  logger.info('MongoDB reconnected successfully.');
});

module.exports = connectDB;
