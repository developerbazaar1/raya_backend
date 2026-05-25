const {
  userListService,
  ownerEmployeeListService,
  ownerEmployeeListByIdService,
  rolesListByBusinessOwnerIdService
} = require('../../services/admin/user.service');

exports.userList = async (req, res) => {
  const data = await userListService(req.admin._id);
  res.status(200).json({
    status: 'success',
    message: 'Users List fetched successfully',
    data
  });
};

exports.ownerEmployeeList = async (req, res) => {
  const data = await ownerEmployeeListService(req.params.businessOwnerId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Owner Employee List fetched successfully',
    data
  });
};

exports.ownerEmployeeById = async (req, res) => {
  const data = await ownerEmployeeListByIdService(
    req.params.employeeId,
    req.params.businessOwnerId,
    req.query
  );
  res.status(200).json({
    status: 'success',
    message: 'Owner Employee List fetched ',
    data
  });
};

exports.rolesListByBusinessOwnerId = async (req, res) => {
  const data = await rolesListByBusinessOwnerIdService(req.params.businessOwnerId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Roles List fetched successfully',
    data
  });
};
