const express          = require('express');
const router           = express.Router();
const mediaController  = require('../controllers/mediaController');
const { protect }      = require('../middleware/auth');
const { uploadMedia }  = require('../middleware/upload');

// All media routes require login
router.use(protect);

router.post  (
  '/upload',
  uploadMedia.array('files', 5),        // max 5 files at once
  mediaController.uploadFiles
);

router.get   ('/',        mediaController.getMyMedia);
router.get   ('/:id',     mediaController.getMediaById);
router.delete('/:id',     mediaController.deleteMedia);

module.exports = router;