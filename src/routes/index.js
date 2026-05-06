const router = require('express').Router();

// Health check route
router.use('/health', require('./health.route'));
router.use('/api/v1/auth', require('./auth/auth.route'));





// For Admin
router.use('/api/v1/admin', require('./admin/adminauth'));
router.use('/api/v1/admin/businesses', require('./admin/businesstype'));



module.exports = router;
