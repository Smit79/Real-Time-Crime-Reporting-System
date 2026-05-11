const express = require('express');
const router  = express.Router();

router.use('/auth',      require('./authRoutes'));
router.use('/crimes',    require('./crimeRoutes'));
router.use('/users',     require('./userRoutes'));
router.use('/admin',     require('./adminRoutes'));
router.use('/alerts',    require('./alertRoutes'));
router.use('/media',     require('./mediaRoutes'));
router.use('/analytics', require('./analyticsRoutes'));

module.exports = router;