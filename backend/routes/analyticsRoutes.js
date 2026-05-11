const express               = require('express');
const router                = express.Router();
const analyticsController   = require('../controllers/analyticsController');
const { protect }           = require('../middleware/auth');
const { authorize }         = require('../middleware/roleCheck');

// Public analytics
router.get('/heatmap',      analyticsController.getHeatmap);      // ?period=7d&crimeType=
router.get('/summary',      analyticsController.getSummaryStats);  // total counts

// Protected analytics (login required)
router.get('/trends',       protect, analyticsController.getTrends);       // ?period=30d
router.get('/by-type',      protect, analyticsController.getByType);       // crime type breakdown
router.get('/by-area',      protect, analyticsController.getByArea);       // area wise breakdown

// Officer + Admin only
router.get(
  '/detailed',
  protect,
  authorize('officer', 'admin'),
  analyticsController.getDetailedReport
);

module.exports = router;