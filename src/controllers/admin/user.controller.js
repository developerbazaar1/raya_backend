const { userListService } = require('../../services/admin/user.service');

exports.userList = async (req, res) => {
  const data = await userListService(req.admin._id);
  res.status(200).json({
    status: 'success',
    message: 'Users List fetched successfully',
    data
  });
};
