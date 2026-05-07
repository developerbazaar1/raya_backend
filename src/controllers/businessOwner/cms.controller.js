const {
  cmsCreateService,
  cmsUpdateService,
  cmsListService,
  cmsGetService
} = require('../../services/businessOwneCms.service');

exports.cmsCreate = async (req, res) => {
  const data = await cmsCreateService(req.body, req.user.userId);
  res.status(201).json({
    success: true,
    message: 'CMS created successfully',
    data
  });
};

exports.cmsUpdate = async (req, res) => {
  const data = await cmsUpdateService(req.params.id, req.body, req.user.userId);
  res.status(200).json({
    success: true,
    message: 'CMS updated successfully',
    data
  });
};

exports.cmsList = async (req, res) => {
  const data = await cmsListService(req.user.userId);
  res.status(200).json({
    success: true,
    message: 'CMS list fetched successfully',
    data
  });
};

exports.cmsGet = async (req, res) => {
  const data = await cmsGetService(req.params.id, req.user.userId);
  res.status(200).json({
    success: true,
    message: 'CMS fetched successfully',
    data
  });
};
