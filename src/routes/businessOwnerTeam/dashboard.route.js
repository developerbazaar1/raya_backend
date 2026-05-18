const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const { getDashboard } = require('../../controllers/businessOwnerTeam/dashboard.controller');

router.get('/', authenticate('employee'), asyncHandler(getDashboard));
module.exports = router;
