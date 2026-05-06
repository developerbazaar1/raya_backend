const {
  getBusinessOwnerSettings,
  getBusinessOwnerFoundation,
  updateBusinessOwnerSettings,
  updateBusinessOwnerFoundation,
  updateBusinessOwnerPassword
} = require('../../services/businessOwnerSetting.service');

const getSettings = async (req, res) => {
  const data = await getBusinessOwnerSettings(req.user.userId);

  res.status(200).json({
    status: 'success',
    message: 'Business owner settings fetched successfully.',
    data: {
      ...data,
      logo: data.logo.url,
      profilePicture: data.profilePicture.url
    }
  });
};

const patchSettings = async (req, res) => {
  const data = await updateBusinessOwnerSettings(req.user.userId, {
    ...req.body,
    files: req.files || {}
  });

  res.status(200).json({
    status: 'success',
    message: 'Business owner settings updated successfully.',
    data: {
      ...data,
      logo: data.logo.url,
      profilePicture: data.profilePicture.url
    }
  });
};

const getFoundation = async (req, res) => {
  const data = await getBusinessOwnerFoundation(req.user.userId);

  res.status(200).json({
    status: 'success',
    message: 'Business foundation fetched successfully.',
    data
  });
};

const patchFoundation = async (req, res) => {
  const data = await updateBusinessOwnerFoundation(req.user.userId, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Business foundation updated successfully.',
    data
  });
};

const updatePassword = async (req, res) => {
  const data = await updateBusinessOwnerPassword(req.user.userId, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully.',
    data
  });
};

module.exports = {
  getSettings,
  getFoundation,
  patchSettings,
  patchFoundation,
  updatePassword
};
