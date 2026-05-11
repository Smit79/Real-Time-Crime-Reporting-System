const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const { protect }    = require('../middleware/auth');
const rateLimiter    = require('../middleware/rateLimiter');

// Public routes
router.post('/register',        rateLimiter, authController.register);
router.post('/login',           rateLimiter, authController.login);
router.post('/forgot-password', rateLimiter, authController.forgotPassword);
router.post('/reset-password/:token',        authController.resetPassword);
router.post('/verify-email/:token',          authController.verifyEmail);

// Protected routes (login required)
router.post('/logout',          protect, authController.logout);
router.post('/refresh-token',   protect, authController.refreshToken);
router.get ('/me',              protect, authController.getMe);
router.patch('/update-password',protect, authController.updatePassword);

module.exports = router;