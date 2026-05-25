const mongoose = require('mongoose');
const Foundation = require('../../models/businessOwner/businessFoundation.model');
const User = require('../../models/shared/users.model');
const AppError = require('../../utils/appError');

/**
 * Validate Mongo ObjectId
 */
const validateObjectId = (id, fieldName = 'Id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }

  return new mongoose.Types.ObjectId(id);
};

exports.foundationService = async (userId, query) => {
  // Validate userId
  const validUserId = validateObjectId(userId, 'User ID');

  const user = await User.findById(validUserId).select('owner');

  // Check user exists
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Handle missing owner
  if (!user.owner) {
    throw new AppError('Owner not found for this user', 404);
  }

  const ownerId = validateObjectId(user.owner, 'Owner ID');

  // Fetch foundations
  const foundations = await Foundation.find({
    userId: ownerId
  })
    .sort({ createdAt: -1 })
    .lean();

  const formattedResponse = foundations.map((foundation) => {
    return {
      id: foundation._id,
      mission: foundation.mission || '',
      vision: foundation.vision || '',
      values: foundation.values || []
    };
  });

  return formattedResponse;
};
