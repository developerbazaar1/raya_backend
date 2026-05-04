const router = require('express').Router();

// Health check route
router.use('/health', require('./health.route'));
router.use('/api/v1/auth', require('./auth/auth.route'));


module.exports = router;