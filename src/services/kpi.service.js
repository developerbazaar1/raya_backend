const mongoose = require('mongoose');
const KpiCategory = require('../models/businessOwner/kpiCategory.model');
const Kpi = require('../models/businessOwner/kpis.model');
const KpiAssignment = require('../models/businessOwner/kpiAssignment.model');
const AppError = require('../utils/appError');
const EmployeeInfo = require('../models/businessOwnerTeam/employeesInfo.model');
const EmployeeRole = require('../models/businessOwner/employeeRoles.model');
const KpiResetFrequency = require('../models/shared/kpiResetFrequency.model');

exports.kpiCategoryCreateService = async (body, userId) => {
  const { categoryName } = body;

  const existingCategory = await KpiCategory.findOne({
    businessOwnerId: userId,
    categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') }
  });

  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }

  const kpiCategory = new KpiCategory({
    categoryName,
    businessOwnerId: userId
  });

  await kpiCategory.save();

  const formattedCategory = {
    id: kpiCategory._id,
    categoryName: kpiCategory.categoryName || '',
    businessOwnerId: kpiCategory.businessOwnerId || '',
    createdAt: kpiCategory.createdAt || ''
  };

  return formattedCategory;
};

exports.kpiCategoryGetService = async (userId, query = {}) => {
  const { page, limit, search } = query;

  const filter = { businessOwnerId: new mongoose.Types.ObjectId(userId) };

  if (search) {
    const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.categoryName = { $regex: sanitizedSearch, $options: 'i' };
  }

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'kpis',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'kpisList'
      }
    },
    {
      $addFields: {
        kpiCount: { $size: '$kpisList' }
      }
    },
    {
      $project: {
        categoryName: 1,
        createdAt: 1,
        kpiCount: 1
      }
    },
    { $sort: { createdAt: -1 } }
  ];

  if (page || limit) {
    let parsedPage = parseInt(page) || 1;
    let parsedLimit = parseInt(limit) || 10;

    if (parsedPage < 1) parsedPage = 1;
    if (parsedLimit < 1) parsedLimit = 10;

    const skip = (parsedPage - 1) * parsedLimit;

    const [categories, total] = await Promise.all([
      KpiCategory.aggregate([...pipeline, { $skip: skip }, { $limit: parsedLimit }]),
      KpiCategory.countDocuments(filter)
    ]);

    const formattedCategories = categories.map((category) => ({
      id: category._id,
      categoryName: category.categoryName || '',
      kpiCount: category.kpiCount || 0,
      createdAt: category.createdAt || ''
    }));

    return {
      data: formattedCategories,
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit)
    };
  }

  const categories = await KpiCategory.aggregate(pipeline);

  const formattedCategories = categories.map((category) => ({
    id: category._id,
    categoryName: category.categoryName || '',
    kpiCount: category.kpiCount || 0,
    createdAt: category.createdAt || ''
  }));

  return { data: formattedCategories };
};

exports.kpiCategoryUpdateService = async (categoryId, body, userId) => {
  const { categoryName } = body;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID format', 400);
  }

  const kpiCategory = await KpiCategory.findById(categoryId);
  if (!kpiCategory) {
    throw new AppError('KPI Category not found', 404);
  }

  if (kpiCategory.businessOwnerId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to update this category', 401);
  }

  const existingCategory = await KpiCategory.findOne({
    _id: { $ne: categoryId },
    businessOwnerId: userId,
    categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') }
  });

  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }

  kpiCategory.categoryName = categoryName;
  await kpiCategory.save();

  return {
    id: kpiCategory._id,
    categoryName: kpiCategory.categoryName || '',
    businessOwnerId: kpiCategory.businessOwnerId || '',
    createdAt: kpiCategory.createdAt || ''
  };
};

exports.kpiCategoryDeleteService = async (categoryId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID format', 400);
  }

  const kpiCategory = await KpiCategory.findById(categoryId);
  if (!kpiCategory) {
    throw new AppError('KPI Category not found', 404);
  }

  if (kpiCategory.businessOwnerId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to delete this category', 401);
  }

  // Referential Integrity check: ensure no KPIs are orphaned
  const linkedKpisCount = await Kpi.countDocuments({ categoryId: categoryId });
  if (linkedKpisCount > 0) {
    throw new AppError(
      `Cannot delete category. It currently has ${linkedKpisCount} associated KPI(s). Please delete or reassign them first.`,
      400
    );
  }

  await KpiCategory.findByIdAndDelete(categoryId);
  return {};
};

/**
 * Service to create a new KPI under a specific category.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - body.categoryId: Must be a valid ObjectId and belong to the authenticated user.
 * - body.measurementType: Must be a valid ObjectId from MeasurementType collection.
 * - body.kpiName: The name of the KPI.
 * - userId: The ID of the currently authenticated business owner.
 */
exports.kpiCreateService = async (body, userId) => {
  const { categoryId, measurementType, kpiName } = body;

  const category = await KpiCategory.findOne({ _id: categoryId, businessOwnerId: userId });
  if (!category) {
    throw new AppError('Category not found or you do not have permission', 404);
  }

  // Check if KPI with same name and measurement type already exists for this business owner
  const existingKpi = await Kpi.findOne({
    businessOwnerId: userId,
    kpiName: { $regex: new RegExp(`^${kpiName.trim()}$`, 'i') },
    measurementType
  });

  if (existingKpi) {
    throw new AppError('KPI with same name and measurement type already exists', 400);
  }

  const kpi = new Kpi({
    businessOwnerId: userId,
    categoryId,
    measurementType,
    kpiName
  });

  await kpi.save();

  return {
    id: kpi._id,
    kpiName: kpi.kpiName,
    categoryId: kpi.categoryId,
    measurementType: kpi.measurementType,
    createdAt: kpi.createdAt
  };
};

/**
 * Service to fetch all KPIs grouped by their category for a business owner.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - userId: Identifies the business owner to fetch data for.
 * - KpiCategory (Model): The root collection to aggregate from.
 * - Kpi (Model): Joined to fetch associated KPIs per category.
 * - MeasurementType (Model): Joined to resolve the measurement type ID into names and symbols.
 */
exports.kpiGetService = async (userId) => {
  const matchFilter = { businessOwnerId: new mongoose.Types.ObjectId(userId) };

  const pipeline = [
    { $match: matchFilter },
    {
      $lookup: {
        from: 'kpis',
        let: { category_id: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$categoryId', '$$category_id'] } } },
          {
            $lookup: {
              from: 'measurementtypes',
              localField: 'measurementType',
              foreignField: '_id',
              as: 'measurementTypeData'
            }
          },
          {
            $unwind: {
              path: '$measurementTypeData',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              kpiName: 1,
              measurementType: '$measurementTypeData.name',
              measurementSymbol: '$measurementTypeData.symbol'
            }
          }
        ],
        as: 'kpisList'
      }
    },
    {
      $project: {
        _id: 1,
        categoryName: 1,
        kpis: {
          $map: {
            input: '$kpisList',
            as: 'kpi',
            in: {
              id: '$$kpi._id',
              nameOfKpi: '$$kpi.kpiName',
              measurementType: '$$kpi.measurementType',
              measurementSymbol: '$$kpi.measurementSymbol'
            }
          }
        }
      }
    },
    { $sort: { categoryName: 1 } }
  ];

  const categoriesWithKpis = await KpiCategory.aggregate(pipeline);

  const formattedData = categoriesWithKpis.map((cat) => ({
    id: cat._id,
    kpiCategoryName: cat.categoryName,
    KPIs: cat.kpis || []
  }));

  return { data: formattedData };
};

/**
 * Service to update an existing KPI name.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - kpiId: The unique identifier of the KPI to update.
 * - body.kpiName: The new name for the KPI.
 * - userId: The ID of the currently authenticated business owner.
 */
exports.kpiUpdateService = async (kpiId, body, userId) => {
  const { kpiName } = body;

  if (!mongoose.Types.ObjectId.isValid(kpiId)) {
    throw new AppError('Invalid KPI ID format', 400);
  }

  const kpi = await Kpi.findOne({ _id: kpiId, businessOwnerId: userId });
  if (!kpi) {
    throw new AppError('KPI not found or you do not have permission', 404);
  }

  // Check if another KPI with the same name and measurement type already exists
  const existingKpi = await Kpi.findOne({
    _id: { $ne: kpiId },
    businessOwnerId: userId,
    kpiName: { $regex: new RegExp(`^${kpiName.trim()}$`, 'i') },
    measurementType: kpi.measurementType
  });

  if (existingKpi) {
    throw new AppError('KPI with same name and measurement type already exists', 400);
  }

  kpi.kpiName = kpiName;
  await kpi.save();

  return {
    id: kpi._id,
    kpiName: kpi.kpiName,
    categoryId: kpi.categoryId,
    measurementType: kpi.measurementType,
    createdAt: kpi.createdAt
  };
};

/**
 * Service to delete an existing KPI.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - kpiId: The unique identifier of the KPI to delete.
 * - userId: The ID of the currently authenticated business owner.
 */
exports.kpiDeleteService = async (kpiId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(kpiId)) {
    throw new AppError('Invalid KPI ID format', 400);
  }

  const kpi = await Kpi.findById(kpiId);
  if (!kpi) {
    throw new AppError('KPI not found', 404);
  }

  if (kpi.businessOwnerId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to delete this KPI', 401);
  }

  // Referential Integrity check: ensure no KPI Assignments are orphaned
  const linkedAssignmentsCount = await KpiAssignment.countDocuments({ kpiId: kpiId });
  if (linkedAssignmentsCount > 0) {
    throw new AppError(
      `Cannot delete KPI. It is currently assigned to ${linkedAssignmentsCount} record(s). Please remove these assignments first.`,
      400
    );
  }

  await Kpi.findByIdAndDelete(kpiId);
  return {};
};

/**
 * Core service to handle the complex KPI assignment logic across three distinct scenarios.
 * It resolves the target employees to assign the KPI to, maps dynamic database frequencies,
 * and performs a bulk upsert operation.
 *
 * Required parameters:
 * - businessOwnerId: The authenticated business owner's ObjectID.
 * - payload: Request body containing the following fields:
 *   - categoryId: String (Valid MongoDB ObjectId) - The KPI Category ID.
 *   - kpiId: String (Valid MongoDB ObjectId) - The specific KPI ID.
 *   - goalValue: Number (Greater than zero) - The target KPI score/metric goal.
 *   - resetFrequency: String (Valid MongoDB ObjectId) - Dynamic reference to KpiResetFrequency document.
 *   - isRepeat: Boolean (Optional, defaults to false) - Flag for recurring cyclical resets.
 *   - roleId: String (Valid MongoDB ObjectId OR 'all') - Target role for KPI assignment.
 *   - assignedUserIds: Array of Strings (Valid User ObjectIds OR ['all']) - Target employee User IDs.
 */
exports.kpiAssignService = async (businessOwnerId, payload) => {
  const {
    categoryId,
    kpiId,
    goalValue,
    resetFrequency,
    isRepeat = false,
    roleId,
    assignedUserIds
  } = payload;

  const categoryExists = await KpiCategory.findOne({ _id: categoryId, businessOwnerId });
  if (!categoryExists) {
    throw new AppError('KPI Category not found or unauthorized access.', 404);
  }

  const kpiExists = await Kpi.findOne({ _id: kpiId, categoryId, businessOwnerId });
  if (!kpiExists) {
    throw new AppError(
      'KPI not found, unauthorized, or does not belong to the selected category.',
      404
    );
  }

  const freqDoc = await KpiResetFrequency.findById(resetFrequency);
  if (!freqDoc) {
    throw new AppError('The selected reset frequency reference was not found.', 404);
  }
  const frequencyCode = freqDoc.name.toLowerCase();

  let targetEmployees;

  if (roleId === 'all') {
    targetEmployees = await EmployeeInfo.find({
      businessOwnerId,
      isDeleted: false
    }).select('userId employeeRoleId');
  } else {
    const roleExists = await EmployeeRole.findOne({ _id: roleId, businessOwnerId });
    if (!roleExists) {
      throw new AppError('The specified employee role was not found.', 404);
    }

    if (assignedUserIds.includes('all')) {
      targetEmployees = await EmployeeInfo.find({
        businessOwnerId,
        employeeRoleId: roleId,
        isDeleted: false
      }).select('userId employeeRoleId');
    } else {
      targetEmployees = await EmployeeInfo.find({
        businessOwnerId,
        employeeRoleId: roleId,
        userId: { $in: assignedUserIds },
        isDeleted: false
      }).select('userId employeeRoleId');
    }
  }

  if (targetEmployees.length === 0) {
    throw new AppError('No active employees matching the assignment criteria were found.', 404);
  }

  const targetUserIds = targetEmployees.map((emp) => emp.userId);
  const existingAssignments = await KpiAssignment.find({
    businessOwnerId,
    kpiId,
    assignedUserId: { $in: targetUserIds }
  }).select('assignedUserId');

  const alreadyAssignedUserIds = new Set(
    existingAssignments.map((a) => a.assignedUserId.toString())
  );

  const newEmployeesToAssign = targetEmployees.filter(
    (emp) => !alreadyAssignedUserIds.has(emp.userId.toString())
  );

  if (newEmployeesToAssign.length === 0) {
    throw new AppError('All selected employees have already been assigned this KPI.', 400);
  }

  const bulkOps = newEmployeesToAssign.map((emp) => ({
    updateOne: {
      filter: {
        businessOwnerId,
        kpiId,
        assignedUserId: emp.userId
      },
      update: {
        $set: {
          categoryId,
          roleId: emp.employeeRoleId || null,
          goalValue,
          resetFrequency: frequencyCode,
          isRepeat: isRepeat === true || isRepeat === 'true',
          status: 'on_track'
        },
        $setOnInsert: {
          progress: 0
        }
      },
      upsert: true
    }
  }));

  const result = await KpiAssignment.bulkWrite(bulkOps);

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    newlyAssignedCount: newEmployeesToAssign.length,
    skippedCount: alreadyAssignedUserIds.size,
    totalAssignments: targetEmployees.length
  };
};

exports.kpiAssignmentUpdateService = async (kpiId, businessOwnerId, payload) => {
  const { assignedUserId, goalValue, resetFrequency, isRepeat, progress } = payload;

  if (!mongoose.Types.ObjectId.isValid(kpiId) || !mongoose.Types.ObjectId.isValid(assignedUserId)) {
    throw new AppError('Invalid ID format.', 400);
  }

  const assignment = await KpiAssignment.findOne({
    businessOwnerId,
    kpiId,
    assignedUserId
  });

  if (!assignment) {
    throw new AppError('KPI assignment not found.', 404);
  }

  if (goalValue !== undefined) {
    assignment.goalValue = goalValue;
  }

  if (progress !== undefined) {
    assignment.progress = Number(progress);
  }

  if (isRepeat !== undefined) {
    assignment.isRepeat = isRepeat === true || isRepeat === 'true';
  }

  if (resetFrequency) {
    const freqDoc = await KpiResetFrequency.findById(resetFrequency);
    if (!freqDoc) {
      throw new AppError('The selected reset frequency reference was not found.', 404);
    }
    assignment.resetFrequency = freqDoc.name.toLowerCase();
  }

  await assignment.save();

  const assignmentObj = assignment.toObject();

  let percent = 0;
  if (assignmentObj.goalValue > 0) {
    percent = Math.round((assignmentObj.progress / assignmentObj.goalValue) * 100);
    percent = Math.min(percent, 100);
  }

  assignmentObj.progressPercent = percent;

  return assignmentObj;
};

exports.kpiLeaderboardService = async (userId) => {
  const pipeline = [
    {
      $match: {
        businessOwnerId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: Kpi.collection.name,
        localField: '_id',
        foreignField: 'categoryId',
        as: 'kpiDefinitions'
      }
    },
    {
      $lookup: {
        from: KpiAssignment.collection.name,
        localField: '_id',
        foreignField: 'categoryId',
        as: 'assignments'
      }
    },
    {
      $project: {
        categoryName: 1,
        createdAt: 1,
        kpisCount: { $size: '$kpiDefinitions' },
        lastUpdated: { $max: '$assignments.updatedAt' },
        kpiProgresses: {
          $map: {
            input: '$kpiDefinitions',
            as: 'k',
            in: {
              $let: {
                vars: {
                  kpiAssignments: {
                    $filter: {
                      input: '$assignments',
                      as: 'a',
                      cond: { $eq: ['$$a.kpiId', '$$k._id'] }
                    }
                  }
                },
                in: {
                  $cond: {
                    if: { $gt: [{ $size: '$$kpiAssignments' }, 0] },
                    then: {
                      $avg: {
                        $map: {
                          input: '$$kpiAssignments',
                          as: 'ka',
                          in: {
                            $min: [
                              {
                                $cond: {
                                  if: { $gt: ['$$ka.goalValue', 0] },
                                  then: {
                                    $multiply: [
                                      { $divide: ['$$ka.progress', '$$ka.goalValue'] },
                                      100
                                    ]
                                  },
                                  else: 0
                                }
                              },
                              100
                            ]
                          }
                        }
                      }
                    },
                    else: 0
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $project: {
        id: '$_id',
        _id: 0,
        categoryName: 1,
        kpisCount: 1,
        lastUpdated: 1,
        createdAt: 1,
        progress: {
          $cond: {
            if: { $gt: [{ $size: '$kpiProgresses' }, 0] },
            then: { $round: [{ $avg: '$kpiProgresses' }, 0] },
            else: 0
          }
        }
      }
    },
    {
      $sort: { categoryName: 1 }
    }
  ];

  const categories = await KpiCategory.aggregate(pipeline);

  return categories.map((cat) => {
    let formattedDate = '';
    const dateToUse = cat.lastUpdated || cat.createdAt;
    if (dateToUse) {
      const d = new Date(dateToUse);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      formattedDate = `${mm}/${dd}/${yyyy}`;
    }

    return {
      id: cat.id,
      categoryName: cat.categoryName,
      kpisCount: cat.kpisCount || 0,
      progress: cat.progress || 0,
      trend: cat.progress >= 50 ? 'up' : 'down',
      lastUpdated: formattedDate
    };
  });
};
/**
 * Unified service to retrieve KPIs.
 * - If categoryId is provided: Returns KPIs under that specific category.
 * - If categoryId is omitted/null: Returns all KPIs across all categories (flat list).
 * - If assignedUserId is provided: Returns only KPIs assigned to that specific user, with raw progress/goal values.
 *
 * Parameters:
 * - categoryId: String (Optional, Valid MongoDB ObjectId) - Filter by category.
 * - userId: String (Valid MongoDB ObjectId) - Authenticated business owner's ID.
 * - query: Object (Optional) - Query parameters, containing optional assignedUserId.
 *
 * Returns:
 * - Array of objects containing: id, kpiName, measurementType, measurementSymbol, progressPercent, progressValue, goalValue, lastUpdated
 */
exports.getKpisByCategoryService = async (categoryId, userId, query = {}) => {
  const { assignedUserId, page, limit } = query;

  // Build match stage dynamically
  const matchStage = {
    businessOwnerId: new mongoose.Types.ObjectId(userId)
  };

  // Filter by category only if a categoryId is passed
  if (categoryId) {
    matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
  }

  const pipeline = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'measurementtypes',
        localField: 'measurementType',
        foreignField: '_id',
        as: 'measurementTypeData'
      }
    },
    {
      $unwind: {
        path: '$measurementTypeData',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      // Dynamic lookup: filter joined assignments by assignedUserId if provided
      $lookup: {
        from: KpiAssignment.collection.name,
        let: { kpi_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$kpiId', '$$kpi_id'] },
                  ...(assignedUserId
                    ? [{ $eq: ['$assignedUserId', new mongoose.Types.ObjectId(assignedUserId)] }]
                    : [])
                ]
              }
            }
          }
        ],
        as: 'assignments'
      }
    },
    // Dynamic filter: if assignedUserId is provided, return ONLY KPIs assigned to that user
    ...(assignedUserId ? [{ $match: { 'assignments.0': { $exists: true } } }] : []),
    {
      $project: {
        kpiName: 1,
        measurementType: '$measurementTypeData.name',
        measurementSymbol: '$measurementTypeData.symbol',
        lastUpdated: { $max: '$assignments.updatedAt' },
        progressValue: {
          $cond: {
            if: assignedUserId ? true : false,
            then: { $first: '$assignments.progress' },
            else: null
          }
        },
        goalValue: {
          $cond: {
            if: assignedUserId ? true : false,
            then: { $first: '$assignments.goalValue' },
            else: null
          }
        },
        progressPercent: {
          $cond: {
            if: { $gt: [{ $size: '$assignments' }, 0] },
            then: {
              $round: [
                {
                  $avg: {
                    $map: {
                      input: '$assignments',
                      as: 'ka',
                      in: {
                        $min: [
                          {
                            $cond: {
                              if: { $gt: ['$$ka.goalValue', 0] },
                              then: {
                                $multiply: [{ $divide: ['$$ka.progress', '$$ka.goalValue'] }, 100]
                              },
                              else: 0
                            }
                          },
                          100
                        ]
                      }
                    }
                  }
                },
                0
              ]
            },
            else: 0
          }
        }
      }
    },
    {
      $sort: { kpiName: 1 }
    }
  ];

  if (page || limit) {
    let parsedPage = parseInt(page) || 1;
    let parsedLimit = parseInt(limit) || 10;

    if (parsedPage < 1) parsedPage = 1;
    if (parsedLimit < 1) parsedLimit = 10;

    const skip = (parsedPage - 1) * parsedLimit;

    // Fetch the total count dynamically matching all filters in the pipeline
    const countResult = await Kpi.aggregate([...pipeline, { $count: 'count' }]);
    const total = countResult[0]?.count || 0;

    const kpis = await Kpi.aggregate([...pipeline, { $skip: skip }, { $limit: parsedLimit }]);

    const formattedKpis = kpis.map((kpi) => {
      let formattedDate = '';
      if (kpi.lastUpdated) {
        const d = new Date(kpi.lastUpdated);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        formattedDate = `${mm}/${dd}/${yyyy}`;
      }

      return {
        id: kpi._id,
        kpiName: kpi.kpiName || '',
        measurementType: kpi.measurementType || '',
        measurementSymbol: kpi.measurementSymbol || '',
        progressPercent: kpi.progressPercent || 0,
        progressValue: kpi.progressValue !== undefined ? kpi.progressValue : null,
        goalValue: kpi.goalValue !== undefined ? kpi.goalValue : null,
        lastUpdated: formattedDate
      };
    });

    return {
      data: formattedKpis,
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit)
    };
  }

  const kpis = await Kpi.aggregate(pipeline);

  const formattedKpis = kpis.map((kpi) => {
    let formattedDate = '';
    if (kpi.lastUpdated) {
      const d = new Date(kpi.lastUpdated);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      formattedDate = `${mm}/${dd}/${yyyy}`;
    }

    return {
      id: kpi._id,
      kpiName: kpi.kpiName || '',
      measurementType: kpi.measurementType || '',
      measurementSymbol: kpi.measurementSymbol || '',
      progressPercent: kpi.progressPercent || 0,
      progressValue: kpi.progressValue !== undefined ? kpi.progressValue : null,
      goalValue: kpi.goalValue !== undefined ? kpi.goalValue : null,
      lastUpdated: formattedDate
    };
  });

  return {
    data: formattedKpis
  };
};

/**
 * Service to retrieve the leaderboard (ranked list of employee progress) for a specific KPI.
 *
 * Parameters:
 * - kpiId: String (Valid MongoDB ObjectId) - Specific KPI ID to query.
 * - businessOwnerId: String (Valid MongoDB ObjectId) - Authenticated business owner ID.
 *
 * Returns:
 * - Array of objects containing: rank, userId, employeeName, profileImage, progressPercent, progressValue, goalValue, trend, lastUpdated
 */
exports.getSpecificKpiLeaderboardService = async (
  kpiId,
  businessOwnerId,
  loggedInUserId = null
) => {
  if (!mongoose.Types.ObjectId.isValid(kpiId)) {
    throw new AppError('Invalid KPI ID format.', 400);
  }

  const kpiExists = await Kpi.findOne({ _id: kpiId, businessOwnerId });
  if (!kpiExists) {
    throw new AppError('KPI definition not found or unauthorized access.', 404);
  }

  const assignments = await KpiAssignment.find({
    businessOwnerId,
    kpiId
  }).populate({
    path: 'assignedUserId',
    select: 'name userProfile'
  });

  const leaderboard = assignments.map((assignment) => {
    const userObj = assignment.assignedUserId || {};
    const employeeName = userObj.name;
    const profileImage = userObj.userProfile?.url || '';

    let progressPercent = 0;
    if (assignment.goalValue > 0) {
      progressPercent = Math.round((assignment.progress / assignment.goalValue) * 100);
      progressPercent = Math.min(progressPercent, 100);
    }

    const d = new Date(assignment.updatedAt);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const formattedDate = `${mm}/${dd}/${yyyy}`;

    return {
      userId: assignment.assignedUserId?._id || null,
      employeeName,
      profileImage,
      progressPercent,
      progressValue: assignment.progress || 0,
      goalValue: assignment.goalValue || 0,
      trend: progressPercent >= 50 ? 'up' : 'down',
      lastUpdated: formattedDate
    };
  });

  leaderboard.sort((a, b) => b.progressPercent - a.progressPercent);

  const rankedLeaderboard = leaderboard.map((item, idx) => ({
    rank: idx + 1,
    ...item
  }));

  if (loggedInUserId) {
    const currentUserIdStr = loggedInUserId.toString();
    const currentUserIdx = rankedLeaderboard.findIndex(
      (item) => item.userId && item.userId.toString() === currentUserIdStr
    );

    if (currentUserIdx !== -1) {
      const currentUserItem = {
        ...rankedLeaderboard[currentUserIdx],
        isCurrentUser: true,
        employeeName: 'You'
      };
      // Remove from its original position and prepend to the top of the array
      rankedLeaderboard.splice(currentUserIdx, 1);
      rankedLeaderboard.unshift(currentUserItem);
    }
  }

  return rankedLeaderboard;
};
