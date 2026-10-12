/**
 * Health Check Controller
 * Verifies system status, uptime, environment, and database connectivity
 */

const mongoose = require('mongoose');
const { getLastDbError } = require('../config/db');

const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'Unknown';
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  res.status(isDatabaseConnected ? 200 : 503).json({
    success: isDatabaseConnected,
    message: isDatabaseConnected
      ? 'Hunarmand Pakistan Backend API is running smoothly.'
      : 'Database connection in progress...',
    project: {
      name: 'Hunarmand Pakistan',
      tagline: 'Har Hunar, Har Shehar, Aap Ke Qareeb.',
      version: '1.0.0',
      phase: 'Phase 1 - Project Foundation',
    },
    system: {
      status: isDatabaseConnected ? 'healthy' : 'unhealthy',
      uptime: `${Math.floor(process.uptime())} seconds`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
    database: {
      status: dbStatus,
      databaseName: mongoose.connection.name || 'test',
      connected: isDatabaseConnected,
      error: getLastDbError(),
    },
  });
};

module.exports = {
  getHealthStatus,
};
