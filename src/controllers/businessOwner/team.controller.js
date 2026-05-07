const {
  createRoleService,
  getRolesService,
  deleteRoleService,
  addMembersToRoleService,
  createMemberService,
  getMembersByRolesService,
  deleteMemberService,
  getMemberService
} = require('../../services/team.service');

const createRole = async (req, res) => {
  const data = await createRoleService(req.user.userId, req.body);

  res.status(201).json({
    status: 'success',
    message: 'Role created successfully.',
    data
  });
};

const getRoles = async (req, res) => {
  const data = await getRolesService(req.user.userId, req.query);

  res.status(200).json({
    status: 'success',
    message: 'Roles fetched successfully.',
    data
  });
};

const deleteRole = async (req, res) => {
  const data = await deleteRoleService(req.user.userId, req.body.roleId);

  res.status(200).json({
    status: 'success',
    message: 'Role and assigned team members deleted successfully.',
    data
  });
};

const addMembersToRole = async (req, res) => {
  const data = await addMembersToRoleService(req.user.userId, req.body);

  res.status(201).json({
    status: 'success',
    message: 'Team members added to role successfully.',
    data
  });
};

const createMember = async (req, res) => {
  const data = await createMemberService(req.user.userId, req.body);

  res.status(201).json({
    status: 'success',
    message: 'Member created successfully.',
    data
  });
};

const getMembersByRoles = async (req, res) => {
  const data = await getMembersByRolesService(req.user.userId, req.query);

  res.status(200).json({
    status: 'success',
    message: 'Members fetched successfully.',
    data
  });
};

const deleteMember = async (req, res) => {
  const data = await deleteMemberService(req.user.userId, req.body.memberId);

  res.status(200).json({
    status: 'success',
    message: 'Member deleted successfully.',
    data
  });
};



const getMembers = async (req, res) => {
   const data = await getMemberService(req.user.userId, req.query);

  res.status(200).json({
    status: 'success',
    message: 'Members fetched successfully.',
    data
  });
}

module.exports = {
  createRole,
  getRoles,
  deleteRole,
  addMembersToRole,
  createMember,
  getMembersByRoles,
  deleteMember,
  getMembers
};
