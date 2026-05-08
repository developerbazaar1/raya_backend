const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { todoCreateValidation } = require('../../validations/todo.validator');
const { todoCreate, todoAll } = require('../../controllers/businessOwner/todo.controller');


router.post(
  '/',
  authenticate('business_owner'),
  validate(todoCreateValidation),
  asyncHandler(todoCreate)
);

router.get('/', authenticate('business_owner'), asyncHandler(todoAll));

module.exports = router;
