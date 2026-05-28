const BusinessFoundationModel = require('../models/businessOwner/businessFoundation.model');
const AppError = require('../utils/appError');

exports.createBusinessFoundationService = async (data, userId) => {
  const { mission, vision, values } = data;
  const existingFoundation = await BusinessFoundationModel.findOne({ userId: userId });
  if (existingFoundation) {
    throw new AppError('Foundation information already exists', 400);
  }
  const newFoundation = await BusinessFoundationModel.create({
    mission,
    vision,
    values,
    userId: userId
  });
  return newFoundation;
};

exports.getBusinessFoundationService = async (userId) => {
  const existingFoundation = await BusinessFoundationModel.findOne({ userId: userId });
  if (!existingFoundation) {
    throw new AppError('Foundation information not found', 404);
  }
  const formattedData = {
    id: existingFoundation._id,
    mission: existingFoundation.mission || '',
    vision: existingFoundation.vision || '',
    values: existingFoundation.values || []
  };
  return formattedData;
};

exports.updateBusinessFoundationService = async (foundationId, data, userId) => {
  const existingFoundation = await BusinessFoundationModel.findById(foundationId);
  if (!existingFoundation) {
    throw new AppError('Foundation information not found', 404);
  }
  if (existingFoundation.userId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to update this foundation', 403);
  }
  const { mission, vision, values } = data;
  const updatedFoundation = await BusinessFoundationModel.findByIdAndUpdate(
    foundationId,
    { mission, vision, values },
    { new: true }
  );
  const formattedData = {
    id: updatedFoundation._id,
    mission: updatedFoundation.mission || '',
    vision: updatedFoundation.vision || '',
    values: updatedFoundation.values || []
  };
  return formattedData;
};
