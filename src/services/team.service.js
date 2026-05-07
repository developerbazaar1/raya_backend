const EmployeeRole = require('../models/businessOwner/employeeRoles.model');
const EmployeeInfo = require('../models/businessOwnerTeam/employeesInfo.model');
const ApplicationLog = require('../models/logging/applicationLog.model');
const User = require('../models/shared/users.model');
const AppError = require('../utils/appError');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { hashPassword } = require('../helper/auth.helper');

const ALLOWED_ROLE_FIELDS = [
  '_id',
  'roleName',
  'businessOwnerId',
  'memberCount',
  'createdAt',
  'updatedAt'
];

const parseFields = (fields) => {
  if (!fields) {
    return ALLOWED_ROLE_FIELDS;
  }

  const requestedFields = String(fields)
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);

  const validFields = requestedFields.filter((field) => ALLOWED_ROLE_FIELDS.includes(field));

  return validFields.length > 0 ? validFields : ALLOWED_ROLE_FIELDS;
};

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRoleResponse = (role, memberCount, selectedFields) => {
  const base = {
    _id: role._id,
    roleName: role.roleName || '',
    businessOwnerId: role.businessOwnerId || null,
    memberCount: memberCount || 0,
    createdAt: role.createdAt || null,
    updatedAt: role.updatedAt || null
  };

  return selectedFields.reduce((acc, field) => {
    acc[field] = base[field];
    return acc;
  }, {});
};

const ensureRoleExists = async (businessOwnerId, roleId) => {
  const role = await EmployeeRole.findOne({
    _id: roleId,
    businessOwnerId
  });

  if (!role) {
    throw new AppError('Role not found.', 404);
  }

  return role;
};

const createTeamLog = async (
  businessOwnerId,
  actionType,
  { targetType = 'employee_role', targetId = '', metadata = {} } = {}
) => {
  await ApplicationLog.create({
    level: 'info',
    service: 'api',
    module: 'team',
    eventType: actionType,
    message: `Team action executed: ${actionType}`,
    actorType: 'business_owner',
    actorId: businessOwnerId.toString(),
    targetType,
    targetId: targetId ? targetId.toString() : '',
    metadata
  });
};

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?&';
  return Array.from(crypto.randomBytes(12))
    .map((byte) => alphabet[byte % alphabet.length])
    .join('')
    .slice(0, 12);
};

const createRoleService = async (businessOwnerId, payload) => {
  const roleName = payload.roleName.trim();
  const existingRole = await EmployeeRole.findOne({
    businessOwnerId,
    roleName: { $regex: `^${escapeRegExp(roleName)}$`, $options: 'i' }
  });

  if (existingRole) {
    throw new AppError('Role already exists.', 400);
  }

  const role = await EmployeeRole.create({
    businessOwnerId,
    roleName
  });

  await createTeamLog(businessOwnerId, 'create_role', {
    targetType: 'employee_role',
    targetId: role._id,
    metadata: {
      roleName: role.roleName
    }
  });

  return buildRoleResponse(role, 0, ALLOWED_ROLE_FIELDS);
};

const getRolesService = async (businessOwnerId, query) => {
  const {
    search = '',
    page,
    limit,
    fields
  } = query;

  const ownerObjectId = toObjectId(businessOwnerId);
  const selectedFields = parseFields(fields);
  const matchStage = { businessOwnerId: ownerObjectId };

  if (search?.trim()) {
    matchStage.roleName = { $regex: escapeRegExp(search.trim()), $options: 'i' };
  }

  const pageNo = Number.parseInt(page, 10);
  const limitNo = Number.parseInt(limit, 10);
  const shouldPaginate = Number.isInteger(pageNo) && pageNo > 0 && Number.isInteger(limitNo) && limitNo > 0;

  const rolePipeline = [
    { $match: matchStage },
    { $sort: { createdAt: -1 } }
  ];

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
                      $and: [
                        { $eq: ['$_id', '$$userId'] },
                        { $eq: ['$isDeleted', false] }
                      ]
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

  const formattedRoles = roles.map((role) => buildRoleResponse(role, role.memberCount, selectedFields));

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

const deleteRoleService = async (businessOwnerId, roleId) => {
  const role = await ensureRoleExists(businessOwnerId, roleId);
  const employeeInfos = await EmployeeInfo.find({
    businessOwnerId,
    employeeRoleId: role._id,
    isDeleted: false
  }).select('userId');

  const userIds = employeeInfos.map((employee) => employee.userId).filter(Boolean);
  const deletedAt = new Date();

  if (userIds.length > 0) {
    await User.updateMany({
      _id: { $in: userIds },
      role: 'employee',
      owner: businessOwnerId
    }, {
      $set: {
        isDeleted: true,
        deletedAt,
        owner: null,
        dateOfJoining: null,
        deviceTokens: []
      }
    });
  }

  await EmployeeInfo.updateMany({
    businessOwnerId,
    employeeRoleId: role._id
  }, {
    $set: {
      isDeleted: true,
      deletedAt,
      businessOwnerId: null,
      employeeRoleId: null,
      hiringDate: null,
      department: '',
      address: '',
      country: '',
      state: '',
      city: '',
      zipCode: ''
    }
  });

  await EmployeeRole.deleteOne({ _id: role._id });

  await createTeamLog(businessOwnerId, 'delete_role', {
    targetType: 'employee_role',
    targetId: role._id,
    metadata: {
      roleName: role.roleName,
      affectedUserIds: userIds,
      affectedUsersCount: userIds.length
    }
  });

  return {
    roleId: role._id,
    deletedUsersCount: userIds.length
  };
};

const addMembersToRoleService = async (businessOwnerId, payload) => {
  const { roleId, userIds } = payload;
  const role = await ensureRoleExists(businessOwnerId, roleId);
  const uniqueUserIds = [...new Set(userIds.map((id) => id.toString()))];

  if (uniqueUserIds.length !== userIds.length) {
    throw new AppError('Duplicate user IDs are not allowed.', 400);
  }

  const users = await User.find({
    _id: { $in: uniqueUserIds },
    role: 'employee',
    isDeleted: false
  });

  if (users.length !== uniqueUserIds.length) {
    throw new AppError('One or more users were not found.', 404);
  }

  const existingEmployeeInfos = await EmployeeInfo.find({
    userId: { $in: uniqueUserIds }
  });
  const employeeInfoMap = new Map(
    existingEmployeeInfos.map((employeeInfo) => [employeeInfo.userId.toString(), employeeInfo])
  );

  const reassignedUserIds = [];

  for (const user of users) {
    user.owner = businessOwnerId;
    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    const existingEmployeeInfo = employeeInfoMap.get(user._id.toString());

    if (existingEmployeeInfo) {
      existingEmployeeInfo.businessOwnerId = businessOwnerId;
      existingEmployeeInfo.employeeRoleId = role._id;
      existingEmployeeInfo.isDeleted = false;
      existingEmployeeInfo.deletedAt = null;
      await existingEmployeeInfo.save();
    } else {
      await EmployeeInfo.create({
        userId: user._id,
        businessOwnerId,
        employeeRoleId: role._id
      });
    }

    reassignedUserIds.push(user._id);
  }

  await createTeamLog(businessOwnerId, 'assign_members', {
    targetType: 'employee_role',
    targetId: role._id,
    metadata: {
      roleName: role.roleName,
      userIds: reassignedUserIds,
      assignedUsersCount: reassignedUserIds.length
    }
  });

  const memberCount = await EmployeeInfo.countDocuments({
    businessOwnerId,
    employeeRoleId: role._id,
    isDeleted: false
  });

  return {
    role: buildRoleResponse(role, memberCount, ALLOWED_ROLE_FIELDS),
    members: users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      owner: user.owner,
      dateOfJoining: user.dateOfJoining
    }))
  };
};

const createMemberService = async (businessOwnerId, payload) => {
  const { name, email, roleId, hiringDate } = payload;
  const role = await ensureRoleExists(businessOwnerId, roleId);
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('User already exists with this email.', 400);
  }

  const temporaryPassword = generateTemporaryPassword();
  const password = await hashPassword(temporaryPassword);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'employee',
    owner: businessOwnerId,
    dateOfJoining: hiringDate
  });

  await EmployeeInfo.create({
    userId: user._id,
    businessOwnerId,
    employeeRoleId: role._id,
    hiringDate
  });

  await createTeamLog(businessOwnerId, 'create_member', {
    targetType: 'employee_user',
    targetId: user._id,
    metadata: {
      roleId: role._id,
      roleName: role.roleName,
      email: user.email
    }
  });

  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    roleId: role._id,
    roleName: role.roleName,
    hiringDate,
    temporaryPassword
  };
};

/**
 * This will fetch members grouped by their roles. It also supports search by member name and pagination at role level. If pagination is applied, it will return paginated roles with their respective members. If pagination is not applied, it will return all roles with their respective members.
 * @param {*} businessOwnerId
 * @param {*} query
 * @returns
 */
const getMembersByRolesService = async (businessOwnerId, query) => {
  const { search = '', page, limit } = query;
  const ownerObjectId = toObjectId(businessOwnerId);

  const pageNo = Number.parseInt(page, 10);
  const limitNo = Number.parseInt(limit, 10);
  const shouldPaginate = Number.isInteger(pageNo) && pageNo > 0 && Number.isInteger(limitNo) && limitNo > 0;

  const roleMatch = { businessOwnerId: ownerObjectId };
  const pipeline = [
    { $match: roleMatch },
    { $sort: { createdAt: -1 } },
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
                      u: { $arrayElemAt: [{ $filter: { input: '$userDetails', as: 'ud', cond: { $eq: ['$$ud._id', '$$member.userId'] } } }, 0] }
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
                          { $concat: [{ $toString: '$$member.mentalHealthScore' }, '/5'] }
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

const deleteMemberService = async (businessOwnerId, memberId) => {
  const employeeInfo = await EmployeeInfo.findOne({
    _id: memberId,
    businessOwnerId,
    isDeleted: false
  });

  if (!employeeInfo) {
    throw new AppError('Member not found.', 404);
  }

  const user = await User.findOne({
    _id: employeeInfo.userId,
    owner: businessOwnerId,
    role: 'employee',
    isDeleted: false
  });

  if (!user) {
    throw new AppError('User associated with member not found.', 404);
  }

  const deletedAt = new Date();

  // Soft delete the user
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        isDeleted: true,
        deletedAt,
        owner: null,
        dateOfJoining: null,
        deviceTokens: []
      }
    }
  );

  // Soft delete the employee info
  await EmployeeInfo.updateOne(
    { _id: employeeInfo._id },
    {
      $set: {
        isDeleted: true,
        deletedAt,
        businessOwnerId: null,
        employeeRoleId: null,
        hiringDate: null,
        department: '',
        address: '',
        country: '',
        state: '',
        city: '',
        zipCode: ''
      }
    }
  );

  await createTeamLog(businessOwnerId, 'delete_member', {
    targetType: 'employee_user',
    targetId: user._id,
    metadata: {
      employeeId: employeeInfo._id,
      email: user.email,
      name: user.name,
      roleId: employeeInfo.employeeRoleId
    }
  });

  return {
    memberId: employeeInfo._id,
    userId: user._id,
    email: user.email
  };
};




const getMemberService = async (businessOwnerId, query) => {
  const { search = '', page, limit } = query;

  const pageNo = Number.parseInt(page, 10);
  const limitNo = Number.parseInt(limit, 10);
  const shouldPaginate = Number.isInteger(pageNo) && pageNo > 0 && Number.isInteger(limitNo) && limitNo > 0;

  const pipeline = [
    {
      $match: {
        businessOwnerId,
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        'user.isDeleted': false,
        // Move search here so it filters against the joined user data
        ...(search?.trim() && {
          'user.name': { $regex: search.trim(), $options: 'i' }
        })
      }
    }
  ];

  // 1. Get the count based on the filtered results
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await EmployeeInfo.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  // 2. Add Pagination and Projection to the main pipeline
  if (shouldPaginate) {
    pipeline.push(
      { $skip: (pageNo - 1) * limitNo },
      { $limit: limitNo }
    );
  }

  pipeline.push({
    $project: {
      _id: 1,
      employeeRoleId: 1,
      userId: '$user._id',
      userName: '$user.name'
    }
  });

  const members = await EmployeeInfo.aggregate(pipeline);

  return {
    items: members,
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

module.exports = {
  createRoleService,
  getRolesService,
  deleteRoleService,
  addMembersToRoleService,
  createMemberService,
  getMembersByRolesService,
  deleteMemberService,
  getMemberService
};
