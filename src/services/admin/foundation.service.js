const mongoose = require('mongoose');
const BusinessFoundationModel = require('../../models/businessOwner/businessFoundation.model');
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
 * Create Business Foundation
 */
exports.createBusinessFoundationService = async (data, adminId) => {
  const { mission, vision, values } = data;
  // Validate admin ID
  const adminObjectId = validateObjectId(adminId, 'Admin ID');
  // Check existing foundation
  const existingFoundation = await BusinessFoundationModel.findOne({
    userId: adminObjectId
  });

  if (existingFoundation) {
    throw new AppError('Foundation information already exists', 400);
  }

  // Create foundation
  const newFoundation = await BusinessFoundationModel.create({
    mission,
    vision,
    values,
    userId: adminObjectId
  });

  return {
    id: newFoundation._id,
    mission: newFoundation.mission || '',
    vision: newFoundation.vision || '',
    values: newFoundation.values || []
  };
};

/**
 * Get Business Foundation
 */
exports.getBusinessFoundationService = async (adminId) => {
  // Validate admin ID
  const adminObjectId = validateObjectId(adminId, 'Admin ID');

  // Find foundation
  const existingFoundation = await BusinessFoundationModel.findOne({
    userId: adminObjectId
  });

  if (!existingFoundation) {
    throw new AppError('Foundation information not found', 404);
  }

  return {
    id: existingFoundation._id,
    mission: existingFoundation.mission || '',
    vision: existingFoundation.vision || '',
    values: existingFoundation.values || []
  };
};

/**
 * Update Business Foundation
 */
exports.updateBusinessFoundationService = async (foundationId, data, adminId) => {
  const { mission, vision, values } = data;

  // Validate IDs
  const foundationObjectId = validateObjectId(foundationId, 'Foundation ID');

  const adminObjectId = validateObjectId(adminId, 'Admin ID');

  // Find foundation
  const existingFoundation = await BusinessFoundationModel.findById(foundationObjectId);

  if (!existingFoundation) {
    throw new AppError('Foundation information not found', 404);
  }

  // Authorization check
  if (existingFoundation.userId.toString() !== adminObjectId.toString()) {
    throw new AppError('You are not authorized to update this foundation', 403);
  }

  // Update foundation
  const updatedFoundation = await BusinessFoundationModel.findByIdAndUpdate(
    foundationObjectId,
    {
      mission,
      vision,
      values
    },
    {
      new: true
    }
  );

  return {
    id: updatedFoundation._id,

    mission: updatedFoundation.mission || '',

    vision: updatedFoundation.vision || '',

    values: updatedFoundation.values || []
  };
};
