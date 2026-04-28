const router = require('express').Router();

// Health check route
router.use('/health', require('./health.route'));


module.exports = router;