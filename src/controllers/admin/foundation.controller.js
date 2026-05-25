const {
  createBusinessFoundationService,
  getBusinessFoundationService,
  updateBusinessFoundationService
} = require('../../services/admin/foundation.service');

exports.createBusinessFoundation = async (req, res) => {
  const data = await createBusinessFoundationService(req.body, req.admin._id);
  res.status(201).json({
    status: 'success',
    message: 'Business Foundation Created successfully',
    data
  });
};
exports.getBusinessFoundation = async (req, res) => {
  const data = await getBusinessFoundationService(req.admin._id);
  res.status(200).json({
    status: 'success',
    message: 'Business Foundation Fetched successfully',
    data
  });
};
exports.updateBusinessFoundation = async (req, res) => {
  const data = await updateBusinessFoundationService(
    req.params.foundationId,
    req.body,
    req.admin._id
  );
  res.status(200).json({
    status: 'success',
    message: 'Business Foundation Updated successfully',
    data
  });
};
