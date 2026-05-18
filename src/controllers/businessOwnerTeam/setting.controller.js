const {
  getProfileService,
  updateProfileService
} = require('../../services/businessOwnerTeam/setting.service');

exports.getProfile = async (req, res) => {
  const data = await getProfileService(req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'Profile fetched successfully.',
    data
  });
};

exports.updateProfile = async (req, res) => {
  const data = await updateProfileService(req.user.userId, req.body);
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    data
  });
};
