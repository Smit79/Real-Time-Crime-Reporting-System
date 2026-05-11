const express           = require('express');
const router            = express.Router();
const alertController   = require('../controllers/alertController');
const { protect }       = require('../middleware/auth');

// All alert routes require login
router.use(protect);

router.get   ('/',          alertController.getMySubscriptions);
router.post  ('/',          alertController.createSubscription);
router.get   ('/:id',       alertController.getSubscriptionById);
router.patch ('/:id',       alertController.updateSubscription);
router.delete('/:id',       alertController.deleteSubscription);

// Toggle subscription on/off
router.patch ('/:id/toggle', alertController.toggleSubscription);

module.exports = router;