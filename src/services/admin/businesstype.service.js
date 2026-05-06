const BusinessType = require('../../models/admin/businessType.model');
const AppError = require('../../utils/appError');


//create businessType
exports.createBusinessType = async (body) => {
  const { name } = body;
  const isExist = await BusinessType.findOne({ name });
  if (isExist) throw new AppError('Business Type already exists', 400);
  const businessType = await BusinessType.create({ name });
  return businessType;
};

//update businessType
exports.updateBusinessType = async (body) => {
  const { id, name } = body;
  const isExist = await BusinessType.findOne({ name });

  if (isExist) throw new AppError('Business Type already exists', 400);

  const businessType = await BusinessType.findByIdAndUpdate(id, { name }, { new: true });
  return businessType;
};

//get all businessType
exports.getAllBusinessTypes = async () => {
  const businessTypes = await BusinessType.find();

  const formattedBusinessType = businessTypes.map(businessType => {
    return {
      id: businessType._id,
      name: businessType.name
    };
  });
  return formattedBusinessType;
};

//get businessType by id
exports.getBusinessTypeById = async (id) => {
  const businessType = await BusinessType.findById(id);
  if (!businessType) throw new AppError('Business Type not found', 404);

  const formattedBusinessType = {
    id: businessType._id,
    name: businessType.name
  };
  return formattedBusinessType;
};
