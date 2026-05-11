const express          = require('express');
const router           = express.Router();
const adminController  = require('../controllers/adminController');
const { protect }      = require('../middleware/auth');
const { authorize }    = require('../middleware/roleCheck');

// All admin routes require login + admin role
router.use(protect);
router.use(authorize('admin'));

// User management
router.get   ('/users',              adminController.getAllUsers);
router.get   ('/users/:id',          adminController.getUserById);
router.patch ('/users/:id/role',     adminController.updateUserRole);
router.patch ('/users/:id/status',   adminController.toggleUserStatus);
router.delete('/users/:id',          adminController.deleteUser);

// Report management
router.get   ('/reports',            adminController.getAllReports);
router.delete('/reports/:id',        adminController.deleteReport);

// Audit logs
router.get   ('/audit-logs',         adminController.getAuditLogs);

// Dashboard stats
router.get   ('/stats',              adminController.getDashboardStats);

module.exports = router;