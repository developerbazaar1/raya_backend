const Foundation = require('../../models/businessOwner/businessFoundation.model');
const User = require('../../models/shared/users.model');
const AppError = require('../../utils/appError');

exports.foundationService = async (userId, query) => {
  const user = await User.findById(userId).select('owner');

  // Handle missing owner
  if (!user.owner) {
    throw new AppError('Owner not found for this user', 404);
  }
  
  const ownerId = user.owner;

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
