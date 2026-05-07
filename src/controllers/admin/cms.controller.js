const {
  cmsCreateService,
  cmsUpdateService,
  cmsGetService,
  cmsListService
} = require('../../services/admin/cms.service');

exports.cmsCreate = async (req, res) => {
  const data = await cmsCreateService(req.body, req.admin._id);
  res.status(201).json({
    status: 'success',
    message: 'Cms created successfully',
    data
  });
};

exports.cmsUpdate = async (req, res) => {
  const data = await cmsUpdateService(req.params.id, req.body, req.admin._id);
  res.status(200).json({
    status: 'success',
    message: 'Cms updated successfully',
    data
  });
};

exports.cmsGet = async (req, res) => {
  const data = await cmsGetService(req.params.id, req.admin._id);
  res.status(200).json({
    status: 'success',
    message: 'Cms fetched successfully',
    data
  });
};

exports.cmsList = async (req, res) => {
  const data = await cmsListService();
  res.status(200).json({
    status: 'success',
    message: 'Cms list fetched successfully',
    data
  });
};
