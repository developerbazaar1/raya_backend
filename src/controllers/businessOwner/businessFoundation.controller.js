const {
  createBusinessFoundationService,
  getBusinessFoundationService,
  updateBusinessFoundationService
} = require('../../services/businessFoundation.service');

exports.createBusinessFoundation = async (req, res) => {
  const data = await createBusinessFoundationService(req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'Business Foundation Created successfully',
    data
  });
};

exports.getBusinessFoundation = async (req, res) => {
  const data = await getBusinessFoundationService(req.user.userId);
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
    req.user.userId
  );
  res.status(200).json({
    status: 'success',
    message: 'Business Foundation Updated successfully',
    data
  });
};
