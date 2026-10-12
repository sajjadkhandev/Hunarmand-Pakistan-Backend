/**
 * Database Configuration & Connection
 * Connects to MongoDB using Mongoose with resilient retry handling and standard cloud fallback
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const DEFAULT_URI =
  'mongodb+srv://sajjadwazir4459_db_user:khanwazir@cluster0.3yoiu8k.mongodb.net/test?retryWrites=true&w=majority';

let lastDbError = null;
let isConnecting = false;
let reconnectTimer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    lastDbError = null;
    return mongoose.connection;
  }

  if (isConnecting) {
    return null;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  isConnecting = true;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    lastDbError = null;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    logger.success(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    lastDbError = error.message;
    logger.error(`MongoDB Connection Error: ${error.message}`);

    // Schedule background retry so when Atlas IP whitelist is added, it connects automatically
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectDB().catch(() => {});
      }, 5000);
    }
    return null;
  } finally {
    isConnecting = false;
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Reconnecting in 3s...');
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectDB().catch(() => {});
    }, 3000);
  }
});

mongoose.connection.on('reconnected', () => {
  lastDbError = null;
  logger.info('MongoDB reconnected successfully.');
});

const getLastDbError = () => lastDbError;

module.exports = connectDB;
module.exports.getLastDbError = getLastDbError;
