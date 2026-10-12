/**
 * Health Check Controller
 * Verifies system status, uptime, environment, and database connectivity
 */

const mongoose = require('mongoose');

const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'Unknown';

  res.status(200).json({
    success: true,
    message: 'Hunarmand Pakistan Backend API is running smoothly.',
    project: {
      name: 'Hunarmand Pakistan',
      tagline: 'Har Hunar, Har Shehar, Aap Ke Qareeb.',
      version: '1.0.0',
      phase: 'Phase 1 - Project Foundation',
    },
    system: {
      status: 'healthy',
      uptime: `${Math.floor(process.uptime())} seconds`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
    database: {
      status: dbStatus,
      databaseName: mongoose.connection.name || 'hunarmand_pakistan',
      connected: mongoose.connection.readyState === 1,
    },
  });
};

module.exports = {
  getHealthStatus,
};
