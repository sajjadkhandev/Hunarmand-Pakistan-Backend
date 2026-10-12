/**
 * Hunarmand Pakistan - Server Entry Point
 * Initializes environment variables, database connection, and starts HTTP server
 */

require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start Express server
const startServer = async () => {
  logger.info('Initializing Hunarmand Pakistan Backend...');

  // Attempt database connection
  await connectDB();

  // Start HTTP Server
  const server = app.listen(PORT, () => {
    logger.success(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger.info(`Health check available at: http://localhost:${PORT}/api/health`);
    logger.info(`Root API available at: http://localhost:${PORT}/api`);
  });

  // Initialize Socket.IO
  const io = initSocket(server);
  app.set('io', io);
  logger.success('Socket.IO real-time engine initialized successfully.');

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Keep server running in development
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
  });
};

startServer();
