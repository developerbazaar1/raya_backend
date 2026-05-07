const router = require('express').Router();

// Health check route
router.use('/health', require('./health.route'));

// Authentication routes
router.use('/api/v1/auth', require('./auth/auth.route'));

//All Business Owner routes
router.use('/api/v1/business-owner/setting', require('./businessOwner/setting.route'));
router.use('/api/v1/business-owner/cms', require('./businessOwner/cms.route'));
router.use('/api/v1/business-owner/projects', require('./businessOwner/project.route'));
router.use('/api/v1/business-owner/projects/tasks', require('./businessOwner/task.route'));

// All Admin routes
router.use('/api/v1/admin/auth', require('./admin/adminauth'));
router.use('/api/v1/admin/businesses', require('./admin/businesstype'));
router.use('/api/v1/admin/cms', require('./admin/cms'));

module.exports = router;
