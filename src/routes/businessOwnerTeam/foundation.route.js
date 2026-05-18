const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const { getFoundation } = require('../../controllers/businessOwnerTeam/foundation.controller');

router.get('/', authenticate('employee'), asyncHandler(getFoundation));
module.exports = router;
