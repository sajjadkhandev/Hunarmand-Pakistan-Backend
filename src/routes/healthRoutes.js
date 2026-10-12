/**
 * Health Check Routes
 * Defines route for system monitoring and initial verification
 */

const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');

// GET /api/health
router.get('/', getHealthStatus);

module.exports = router;
