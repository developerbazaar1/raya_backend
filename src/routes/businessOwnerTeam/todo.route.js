const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
    allTodo,
    updateStatus,
    getHistory
} = require('../../controllers/businessOwnerTeam/todo.controller');
const { updateTodoStatus } = require('../../validations/todo.validator');

router.get('/', authenticate('employee'), asyncHandler(allTodo));
router.get('/history', authenticate('employee'), asyncHandler(getHistory));
router.patch('/status/:todoAssignmentId', authenticate('employee'), validate(updateTodoStatus), asyncHandler(updateStatus));
module.exports = router;
