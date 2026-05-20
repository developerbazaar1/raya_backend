const User = require('../../models/shared/users.model');
const BusinessOwnerInfo = require('../../models/businessOwner/businessOwnerInfo.model');

exports.userListService = async () => {
  const businessOwners = await User.aggregate([
    {
      $match: {
        role: 'business_owner',
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: BusinessOwnerInfo.collection.name,
        localField: '_id',
        foreignField: 'userId',
        as: 'businessOwnerInfo'
      }
    },
    {
      $unwind: {
        path: '$businessOwnerInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        id: '$_id',
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        businessOwnerInfo: {
          businessName: '$businessOwnerInfo.businessName',
          businessType: '$businessOwnerInfo.businessType',
          address: '$businessOwnerInfo.address',
          country: '$businessOwnerInfo.country',
          state: '$businessOwnerInfo.state',
          city: '$businessOwnerInfo.city',
          zipCode: '$businessOwnerInfo.zipCode',
          website: '$businessOwnerInfo.website',
          phoneNumber: '$businessOwnerInfo.phoneNumber',
          approvalStatus: '$businessOwnerInfo.approvalStatus',
          accountStatus: '$businessOwnerInfo.accountStatus'
        }
      }
    }
  ]);

  return businessOwners;
};
