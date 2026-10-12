/**
 * Express Application Configuration
 * Sets up middleware, routes, and global error handling
 */

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://hunarmand-pakistan.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching vercel.app
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during development & cloud deployment
    },
    credentials: true,
  })
);

// Body parsers for JSON and URL-encoded payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple incoming request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Mount master API routes
app.use('/api', apiRoutes);

// Root path redirection/welcome
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hunarmand Pakistan Backend Server is active.',
    healthCheck: '/api/health',
  });
});

// 404 Not Found Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
