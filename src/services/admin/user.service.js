const User = require('../../models/shared/users.model');
const EmployeeRole = require('../../models/businessOwner/employeeRoles.model');
const EmployeeInfo = require('../../models/businessOwnerTeam/employeesInfo.model');
const BusinessOwnerInfo = require('../../models/businessOwner/businessOwnerInfo.model');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');
const AppError = require('../../utils/appError');
const mongoose = require('mongoose');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

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
        businessName: '$businessOwnerInfo.businessName',
        approvalStatus: '$businessOwnerInfo.approvalStatus',
        accountStatus: '$businessOwnerInfo.accountStatus'
      }
    }
  ]);

  return businessOwners;
};

const buildMemberSearchStages = (search) => {
  const searchText = search?.trim();

  if (!searchText) {
    return [];
  }

  return [
    {
      $match: {
        $or: [
          { roleName: { $regex: escapeRegExp(searchText), $options: 'i' } },
          { 'users.userName': { $regex: escapeRegExp(searchText), $options: 'i' } }
        ]
      }
    }
  ];
};

exports.ownerEmployeeListService = async (businessOwnerId, query) => {
  const { search = '', page, limit } = query;

  // ✅ Safe ObjectId conversion — guard against already-ObjectId or invalid input
  let ownerObjectId;
  try {
    ownerObjectId = toObjectId(businessOwnerId.toString());
  } catch (err) {
    return { items: [], pagination: null };
  }

  const pageNo = Number.parseInt(page, 10);
  const limitNo = Number.parseInt(limit, 10);
  const shouldPaginate =
    Number.isInteger(pageNo) && pageNo > 0 && Number.isInteger(limitNo) && limitNo > 0;

  const pipeline = [
    // ✅ Match roles belonging to this business owner
    {
      $match: { businessOwnerId: ownerObjectId }
    },
    { $sort: { createdAt: -1 } },

    // ✅ Lookup active employee infos for each role
    {
      $lookup: {
        from: EmployeeInfo.collection.name,
        let: { roleId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$employeeRoleId', '$$roleId'] },
                  { $eq: ['$businessOwnerId', ownerObjectId] },
                  { $eq: ['$isDeleted', false] }
                ]
              }
            }
          }
        ],
        as: 'members'
      }
    },

    // ✅ Lookup user details for those employees
    {
      $lookup: {
        from: User.collection.name,
        let: { userIds: '$members.userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ['$_id', '$$userIds'] },
                  { $eq: ['$isDeleted', false] }
                ]
              }
            }
          }
        ],
        as: 'userDetails'
      }
    },

    // ✅ Project and merge member + user data
    {
      $project: {
        _id: 0,
        roleId: '$_id',
        roleName: 1,
        users: {
          $filter: {
            input: {
              $map: {
                input: '$members',
                as: 'member',
                in: {
                  $let: {
                    vars: {
                      u: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$userDetails',
                              as: 'ud',
                              cond: { $eq: ['$$ud._id', '$$member.userId'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      userId: '$$u._id',
                      userName: { $ifNull: ['$$u.name', ''] },
                      hireDate: '$$member.hiringDate',
                      personality: { $ifNull: ['$$member.personalityType', ''] },
                      mentalHealth: {
                        $cond: [
                          { $eq: ['$$member.mentalHealthScore', null] },
                          '',
                          {
                            $concat: [
                              { $toString: '$$member.mentalHealthScore' },
                              '/5'
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
              }
            },
            as: 'userObj',
            cond: { $ne: ['$$userObj.userId', null] }
          }
        }
      }
    },

    // ✅ Apply search filter if provided
    ...buildMemberSearchStages(search)
  ];

  let total = 0;
  if (shouldPaginate) {
    const countResult = await EmployeeRole.aggregate([...pipeline, { $count: 'total' }]);
    total = countResult[0]?.total || 0;
    pipeline.push({ $skip: (pageNo - 1) * limitNo }, { $limit: limitNo });
  }

  const data = await EmployeeRole.aggregate(pipeline);

  return {
    items: data,
    pagination: shouldPaginate
      ? {
        page: pageNo,
        limit: limitNo,
        total,
        totalPages: Math.ceil(total / limitNo)
      }
      : null
  };
};

exports.ownerEmployeeListByIdService = async (employeeId) => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError('Invalid Employee ID format.', 400);
  }

  const employeeInfo = await EmployeeInfo.findOne({ userId: employeeId, isDeleted: false })
    .populate('userId', 'name email userProfile')
    .populate('employeeRoleId', 'roleName');

  if (!employeeInfo) {
    throw new AppError('Employee not found.', 404);
  }

  return {
    id: employeeInfo.userId?._id,
    name: employeeInfo.userId?.name || '',
    email: employeeInfo.userId?.email || '',
    profileImage: employeeInfo.userId?.userProfile?.url || DEFAULT_PROFILE_IMAGE,
    role: employeeInfo.employeeRoleId?.roleName || '',
    hiringDate: employeeInfo.hiringDate || '',
    phoneNumber: employeeInfo.phoneNumber || {},
    gender: employeeInfo.gender || '',
    department: employeeInfo.department || '',
    address: employeeInfo.address || '',
    personalityType: employeeInfo.personalityType || '',
    dateOfBirth: employeeInfo.dateOfBirth || '',
    spouseName: employeeInfo.spouseName || '',
    spouseAnniversary: employeeInfo.spouseAnniversary || '',
    spouseGender: employeeInfo.spouseGender || '',
    kids: employeeInfo.kids || [],
    pets: employeeInfo.pets || [],
    favouriteFlower: employeeInfo.favouriteFlower || '',
    favouriteCakeFlavour: employeeInfo.favouriteCakeFlavour || '',
    favouriteOnlineStore: employeeInfo.favouriteOnlineStore || '',
    favouriteLocalBusiness: employeeInfo.favouriteLocalBusiness || '',
    favouriteRestaurants: employeeInfo.favouriteRestaurants || ''
  };
};

exports.rolesListByBusinessOwnerIdService = async (businessOwnerId,query) => {
  const { search = '', page, limit, fields } = query;

  const ownerObjectId = toObjectId(businessOwnerId);
  const selectedFields = parseFields(fields);
  const matchStage = { businessOwnerId: ownerObjectId };

  if (search?.trim()) {
    matchStage.roleName = { $regex: escapeRegExp(search.trim()), $options: 'i' };
  }

  const pageNo = Number.parseInt(page, 10);
  const limitNo = Number.parseInt(limit, 10);
  const shouldPaginate =
      Number.isInteger(pageNo) && pageNo > 0 && Number.isInteger(limitNo) && limitNo > 0;

  const rolePipeline = [{ $match: matchStage }, { $sort: { createdAt: -1 } }];

  if (shouldPaginate) {
    rolePipeline.push({ $skip: (pageNo - 1) * limitNo }, { $limit: limitNo });
  }

  rolePipeline.push(
    {
      $lookup: {
        from: EmployeeInfo.collection.name,
        let: { roleId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$employeeRoleId', '$$roleId'] },
                  { $eq: ['$businessOwnerId', ownerObjectId] },
                  { $eq: ['$isDeleted', false] }
                ]
              }
            }
          },
          {
            $lookup: {
              from: User.collection.name,
              let: { userId: '$userId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$_id', '$$userId'] }, { $eq: ['$isDeleted', false] }]
                    }
                  }
                }
              ],
              as: 'activeUser'
            }
          },
          { $match: { 'activeUser.0': { $exists: true } } },
          { $count: 'count' }
        ],
        as: 'memberStats'
      }
    },
    {
      $addFields: {
        memberCount: { $ifNull: [{ $first: '$memberStats.count' }, 0] }
      }
    },
    { $project: { memberStats: 0 } }
  );

  const [roles, total] = await Promise.all([
    EmployeeRole.aggregate(rolePipeline),
    shouldPaginate ? EmployeeRole.countDocuments(matchStage) : Promise.resolve(null)
  ]);

  const formattedRoles = roles.map((role) =>
    buildRoleResponse(role, role.memberCount, selectedFields)
  );

  return {
    items: formattedRoles,
    pagination: shouldPaginate
      ? {
        page: pageNo,
        limit: limitNo,
        total,
        totalPages: Math.ceil(total / limitNo)
      }
      : null
  };
};

// Define parseFields function to fix 'no-undef' error
const parseFields = (fields) => {
  if (!fields) return [];
  return fields.split(',').map((field) => field.trim());
};

// Define buildRoleResponse function to fix 'no-undef' error
const buildRoleResponse = (role, memberCount, selectedFields) => {
  const response = { id: role._id, name: role.roleName, memberCount };
  if (selectedFields.length) {
    selectedFields.forEach((field) => {
      if (role[field] !== undefined) {
        response[field] = role[field];
      }
    });
  }
  return response;
};
