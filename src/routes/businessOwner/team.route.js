const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const {
  createRoleValidation,
  getRolesValidation,
  deleteRoleValidation,
  addMembersToRoleValidation,
  createMemberValidation,
  getMembersValidation,
  getMembersValidationByRole,
  deleteMemberValidation
} = require('../../validations/team.validator');
const {
  createRole,
  addMembersToRole,
  deleteRole,
  getRoles,
  createMember,
  getMembersByRoles,
  getMembers,
  deleteMember
} = require('../../controllers/businessOwner/team.controller');

router.use(authenticate('business_owner'));

router.post('/role', validate(createRoleValidation), asyncHandler(createRole));
router.patch('/role', validate(addMembersToRoleValidation), asyncHandler(addMembersToRole));
router.delete('/role', validate(deleteRoleValidation), asyncHandler(deleteRole));
router.get('/role', validate(getRolesValidation), asyncHandler(getRoles));
router.post('/member', validate(createMemberValidation), asyncHandler(createMember));
router.get('/role-members', validate(getMembersValidationByRole), asyncHandler(getMembersByRoles));

router.get('/member', validate(getMembersValidation), asyncHandler(getMembers));

router.delete('/member', validate(deleteMemberValidation), asyncHandler(deleteMember));



module.exports = router;
