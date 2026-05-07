const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
    authenticate,
    validate
} = require('../../middlewares');
const { projectCreateValidation, assignedProjectValidation } = require('../../validations/project.validator');
const { projectCreate, projectList, projectDetails, assignedProjects, removeAssignedUser } = require('../../controllers/businessOwner/project.controller');


router.post('/', authenticate('business_owner'), validate(projectCreateValidation), asyncHandler(projectCreate));
router.get('/', authenticate('business_owner'), asyncHandler(projectList));
router.get('/:projectId', authenticate('business_owner'), asyncHandler(projectDetails));
router.patch('/assign/:projectId', authenticate('business_owner'), validate(assignedProjectValidation), asyncHandler(assignedProjects));
router.patch('/unassign/:projectId', authenticate('business_owner'), validate(assignedProjectValidation), asyncHandler(removeAssignedUser));

// task routes
module.exports = router;