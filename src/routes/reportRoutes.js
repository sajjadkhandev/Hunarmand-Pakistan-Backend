/**
 * Report Routes
 * Dispute filing and user reports
 */

const express = require('express');
const router = express.Router();
const { createReport, getMyReports } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', createReport);
router.get('/my', getMyReports);

module.exports = router;
