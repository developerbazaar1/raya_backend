const mongoose = require('mongoose');
const BusinessType = require('../../models/admin/businessType.model');
const AppError = require('../../utils/appError');

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'Id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }

  return new mongoose.Types.ObjectId(id);
};

/**
 * Create Business Type
 */
exports.createBusinessType = async (body) => {
  const { name } = body;

  // Check existing business type
  const isExist = await BusinessType.findOne({
    name: name.trim()
  });

  if (isExist) {
    throw new AppError('Business Type already exists', 400);
  }

  // Create business type
  const businessType = await BusinessType.create({
    name: name.trim()
  });

  return {
    id: businessType._id,
    name: businessType.name
  };
};

/**
 * Update Business Type
 */
exports.updateBusinessType = async (body) => {
  const { id, name } = body;

  // Validate ID
  const businessTypeId = validateObjectId(id, 'Business Type ID');

  // Check duplicate name
  const isExist = await BusinessType.findOne({
    name: name.trim(),
    _id: { $ne: businessTypeId }
  });

  if (isExist) {
    throw new AppError('Business Type already exists', 400);
  }

  // Update business type
  const businessType = await BusinessType.findByIdAndUpdate(
    businessTypeId,
    {
      name: name.trim()
    },
    {
      new: true
    }
  );

  if (!businessType) {
    throw new AppError('Business Type not found', 404);
  }

  return {
    id: businessType._id,
    name: businessType.name
  };
};

/**
 * Get All Business Types
 */
exports.getAllBusinessTypes = async () => {
  const businessTypes = await BusinessType.find().sort({ createdAt: -1 });

  return businessTypes.map((businessType) => ({
    id: businessType._id,
    name: businessType.name
  }));
};

/**
 * Get Business Type By ID
 */
exports.getBusinessTypeById = async (id) => {
  // Validate ID
  const businessTypeId = validateObjectId(id, 'Business Type ID');

  // Find business type
  const businessType = await BusinessType.findById(businessTypeId);

  if (!businessType) {
    throw new AppError('Business Type not found', 404);
  }

  return {
    id: businessType._id,
    name: businessType.name
  };
};
