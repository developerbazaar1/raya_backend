const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { todoCreateValidation, todoUpdateValidation } = require('../../validations/todo.validator');
const { todoCreate, todoAll, updateTodo } = require('../../controllers/businessOwner/todo.controller');

router.post(
  '/',
  authenticate('business_owner'),
  validate(todoCreateValidation),
  asyncHandler(todoCreate)
);

router.get('/', authenticate('business_owner'), asyncHandler(todoAll));
router.put('/:todoId', authenticate('business_owner'), validate(todoUpdateValidation), asyncHandler(updateTodo));
module.exports = router;
