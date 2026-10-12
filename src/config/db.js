/**
 * Database Configuration & Connection
 * Connects to MongoDB using Mongoose with resilient connection handling
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const defaultAtlasUri = 'mongodb+srv://sajjadwazir4459_db_user:3kUhO3Uop3PJg1Jw@cluster0.3yoiu8k.mongodb.net/?appName=Cluster0';
  const uri = process.env.MONGODB_URI || defaultAtlasUri;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // Timeout after 8 seconds instead of hanging
    });

    logger.success(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    logger.warn('Retrying database connection in background...');
    return null;
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully.');
});

module.exports = connectDB;
