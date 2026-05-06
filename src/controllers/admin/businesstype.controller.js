const {
  createBusinessType,
  updateBusinessType,
  getAllBusinessTypes,
  getBusinessTypeById
} = require('../../services/admin/businesstype.service');

exports.createBusinessType = async (req, res) => {
  const businesstype = await createBusinessType(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Business Type created successfully',
    data: businesstype
  });
};

exports.updateBusinessType = async (req, res) => {
  const businesstype = await updateBusinessType({ id: req.params.businessId, ...req.body });
  res.status(200).json({
    status: 'success',
    message: 'Business Type updated successfully',
    data: businesstype
  });
};

exports.getAllBusinessTypes = async (req, res) => {
  const businesstypes = await getAllBusinessTypes();
  res.status(200).json({
    status: 'success',
    message: 'Business Types fetched successfully',
    data: businesstypes
  });
};

exports.getBusinessTypeById = async (req, res) => {
  const businesstype = await getBusinessTypeById(req.params.businessId);
  res.status(200).json({
    status: 'success',
    message: 'Business Type fetched successfully',
    data: businesstype
  });
};
