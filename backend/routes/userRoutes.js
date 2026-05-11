const express          = require('express');
const router           = express.Router();
const userController   = require('../controllers/userController');
const { protect }      = require('../middleware/auth');
const { authorize }    = require('../middleware/roleCheck');
const { uploadAvatar } = require('../middleware/upload');

// All user routes require login
router.use(protect);

router.get   ('/profile',              userController.getProfile);
router.patch ('/profile',              uploadAvatar.single('avatar'), userController.updateProfile);
router.delete('/profile',              userController.deleteAccount);
router.get   ('/my-reports',           userController.getMyReports);
router.get   ('/my-notifications',     userController.getMyNotifications);
router.patch ('/notifications/read',   userController.markNotificationsRead);
router.patch ('/location',             userController.updateLocation);
router.patch ('/fcm-token',            userController.updateFcmToken);

module.exports = router;