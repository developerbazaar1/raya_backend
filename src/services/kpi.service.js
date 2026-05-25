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

  // 1. Verify Category exists and belongs to the business owner
  const categoryExists = await KpiCategory.findOne({ _id: categoryId, businessOwnerId });
  if (!categoryExists) {
    throw new AppError('KPI Category not found or unauthorized access.', 404);
  }

  // 2. Verify KPI exists, belongs to the business owner and matches the category
  const kpiExists = await Kpi.findOne({ _id: kpiId, categoryId, businessOwnerId });
  if (!kpiExists) {
    throw new AppError(
      'KPI not found, unauthorized, or does not belong to the selected category.',
      404
    );
  }

  // 3. Resolve the Reset Frequency display name (e.g. 'Weekly') to lowercased enum values (e.g. 'weekly')
  const freqDoc = await KpiResetFrequency.findById(resetFrequency);
  if (!freqDoc) {
    throw new AppError('The selected reset frequency reference was not found.', 404);
  }
  const frequencyCode = freqDoc.name.toLowerCase();

  // 4. Resolve the target employee users based on the assignment scenarios
  let targetEmployees;

  if (roleId === 'all') {
    // Scenario 3: All roles and all users in the company
    targetEmployees = await EmployeeInfo.find({
      businessOwnerId,
      isDeleted: false
    }).select('userId employeeRoleId');
  } else {
    // Check if the specified role exists
    const roleExists = await EmployeeRole.findOne({ _id: roleId, businessOwnerId });
    if (!roleExists) {
      throw new AppError('The specified employee role was not found.', 404);
    }

    if (assignedUserIds.includes('all')) {
      // Scenario 2: Specific role, all users in that role
      targetEmployees = await EmployeeInfo.find({
        businessOwnerId,
        employeeRoleId: roleId,
        isDeleted: false
      }).select('userId employeeRoleId');
    } else {
      // Scenario 1: Specific role, specific subset of users in that role
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

  // 5. Build bulk upsert operations to assign/update KPIs efficiently
  const bulkOps = targetEmployees.map((emp) => ({
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
    totalAssignments: targetEmployees.length
  };
};
