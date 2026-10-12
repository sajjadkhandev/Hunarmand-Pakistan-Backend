/**
 * Database Configuration & Connection
 * Connects to MongoDB using Mongoose with resilient retry handling and standard cloud fallback
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const DIRECT_REPLICA_SET_URI =
  'mongodb://sajjadwazir4459_db_user:khanwazir@ac-6ywq50y-shard-00-00.3yoiu8k.mongodb.net:27017,ac-6ywq50y-shard-00-01.3yoiu8k.mongodb.net:27017,ac-6ywq50y-shard-00-02.3yoiu8k.mongodb.net:27017/test?ssl=true&authSource=admin&retryWrites=true&w=majority';

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

  isConnecting = true;
  const primaryUri = process.env.MONGODB_URI || DIRECT_REPLICA_SET_URI;

  try {
    const conn = await mongoose.connect(primaryUri, {
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
    logger.warn(`Primary MongoDB URI failed: ${error.message}. Attempting direct replica set URI...`);

    // If primary failed (e.g. querySrv ETIMEOUT or DNS error), try direct replica set URI immediately
    try {
      const conn = await mongoose.connect(DIRECT_REPLICA_SET_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      lastDbError = null;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      logger.success(`MongoDB Connected via direct replica set: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (fallbackError) {
      lastDbError = fallbackError.message;
      logger.error(`MongoDB Fallback Connection Error: ${fallbackError.message}`);

      // Schedule background retry so when Atlas IP whitelist is added, it connects automatically
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectDB().catch(() => {});
        }, 5000);
      }
      return null;
    }
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
