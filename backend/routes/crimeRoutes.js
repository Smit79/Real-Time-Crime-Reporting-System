const express          = require('express');
const router           = express.Router();
const crimeController  = require('../controllers/crimeController');
const { protect }      = require('../middleware/auth');
const { authorize }    = require('../middleware/roleCheck');
const rateLimiter      = require('../middleware/rateLimiter');
const { uploadMedia }  = require('../middleware/upload');

// Public routes
router.get('/',          crimeController.getAllReports);   // with filters & pagination
router.get('/nearby',    crimeController.getNearbyReports); // ?lat=&lng=&radius=
router.get('/heatmap',   crimeController.getHeatmapData);
router.get('/:id',       crimeController.getReportById);

// Protected routes (login required)
router.post(
  '/',
  protect,
  rateLimiter,
  uploadMedia.array('media', 5),        // max 5 files
  crimeController.createReport
);

router.patch('/:id',     protect, uploadMedia.array('media', 5), crimeController.updateReport);
router.delete('/:id',    protect, crimeController.deleteReport);
router.post('/:id/upvote', protect, crimeController.upvoteReport);

// Officer / Admin only
router.patch(
  '/:id/status',
  protect,
  authorize('officer', 'admin'),
  crimeController.updateReportStatus
);

module.exports = router;