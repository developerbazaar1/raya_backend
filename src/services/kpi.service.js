const mongoose = require('mongoose');
const KpiCategory = require('../models/businessOwner/kpiCategory.model');
const Kpi = require('../models/businessOwner/kpis.model');
const KpiAssignment = require('../models/businessOwner/kpiAssignment.model');
const KpiHistory = require('../models/businessOwner/kpiHistory.model');
const BusinessOwnerInfo = require('../models/businessOwner/businessOwnerInfo.model');
const AppError = require('../utils/appError');
const EmployeeInfo = require('../models/businessOwnerTeam/employeesInfo.model');
const EmployeeRole = require('../models/businessOwner/employeeRoles.model');
const KpiResetFrequency = require('../models/shared/kpiResetFrequency.model');

// Resolves calendar components in target timezone.
function getTzParts(timeZone, date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = parseInt(part.value, 10);
    }
  }
  return map;
}

// Maps calendar dates to localized UTC boundaries.
function localToUtc(year, month, day, hour, minute, second, millisecond, timeZone) {
  const t_approx = Date.UTC(year, month - 1, day, hour, minute, second);
  const parts = getTzParts(timeZone, new Date(t_approx));
  const t_parts = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offset = t_parts - t_approx;

  const t_exact_approx = t_approx - offset;
  const parts2 = getTzParts(timeZone, new Date(t_exact_approx));
  const t_parts2 = Date.UTC(parts2.year, parts2.month - 1, parts2.day, parts2.hour, parts2.minute, parts2.second);
  const offset2 = t_parts2 - t_exact_approx;

  return new Date(t_exact_approx - (offset2 - offset) + millisecond);
}

// Resolves ISO week and year from calendar parts.
function getISOWeekAndYear(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

// Calculates localized start and end dates in UTC for a target timezone.
function getPeriodBoundsAndIdentifier(periodType, periodIdentifier, timeZone) {
  let periodStartDate, periodEndDate;

  if (periodType === 'monthly') {
    if (!/^\d{4}-\d{2}$/.test(periodIdentifier)) {
      throw new AppError('periodIdentifier must be in YYYY-MM format for monthly type.', 400);
    }
    const [yearStr, monthStr] = periodIdentifier.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (month < 1 || month > 12) {
      throw new AppError('Invalid month value in periodIdentifier.', 400);
    }

    periodStartDate = localToUtc(year, month, 1, 0, 0, 0, 0, timeZone);
    const nextMonth = new Date(Date.UTC(year, month, 0));
    const lastDay = nextMonth.getUTCDate();
    periodEndDate = localToUtc(year, month, lastDay, 23, 59, 59, 999, timeZone);

  } else if (periodType === 'weekly') {
    if (!/^\d{4}-W\d{2}$/.test(periodIdentifier)) {
      throw new AppError('periodIdentifier must be in YYYY-WXX format for weekly type.', 400);
    }
    const [yearStr, weekStr] = periodIdentifier.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);

    if (week < 1 || week > 53) {
      throw new AppError('Invalid week number in periodIdentifier.', 400);
    }

    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dow = simple.getUTCDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4) {
      ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
    } else {
      ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
    }

    const startYear = ISOweekStart.getUTCFullYear();
    const startMonth = ISOweekStart.getUTCMonth() + 1;
    const startDay = ISOweekStart.getUTCDate();

    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setUTCDate(ISOweekStart.getUTCDate() + 6);
    const endYear = ISOweekEnd.getUTCFullYear();
    const endMonth = ISOweekEnd.getUTCMonth() + 1;
    const endDay = ISOweekEnd.getUTCDate();

    periodStartDate = localToUtc(startYear, startMonth, startDay, 0, 0, 0, 0, timeZone);
    periodEndDate = localToUtc(endYear, endMonth, endDay, 23, 59, 59, 999, timeZone);

  } else if (periodType === 'yearly') {
    if (!/^\d{4}$/.test(periodIdentifier)) {
      throw new AppError('periodIdentifier must be in YYYY format for yearly type.', 400);
    }
    const year = parseInt(periodIdentifier, 10);

    periodStartDate = localToUtc(year, 1, 1, 0, 0, 0, 0, timeZone);
    periodEndDate = localToUtc(year, 12, 31, 23, 59, 59, 999, timeZone);

  } else if (periodType === 'daily') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodIdentifier)) {
      throw new AppError('periodIdentifier must be in YYYY-MM-DD format for daily type.', 400);
    }
    const [yearStr, monthStr, dayStr] = periodIdentifier.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    periodStartDate = localToUtc(year, month, day, 0, 0, 0, 0, timeZone);
    periodEndDate = localToUtc(year, month, day, 23, 59, 59, 999, timeZone);
  } else {
    throw new AppError('Unsupported periodType.', 400);
  }

  return { periodStartDate, periodEndDate, periodIdentifier };
}

// Resolves bounds for the current period in target timezone.
function getCurrentPeriodBoundsAndIdentifier(periodType, timeZone) {
  const now = new Date();
  const parts = getTzParts(timeZone, now);

  let periodIdentifier;
  if (periodType === 'monthly') {
    const yearStr = String(parts.year);
    const monthStr = String(parts.month).padStart(2, '0');
    periodIdentifier = `${yearStr}-${monthStr}`;
  } else if (periodType === 'weekly') {
    const iso = getISOWeekAndYear(parts.year, parts.month, parts.day);
    const yearStr = String(iso.year);
    const weekStr = String(iso.week).padStart(2, '0');
    periodIdentifier = `${yearStr}-W${weekStr}`;
  } else if (periodType === 'yearly') {
    periodIdentifier = String(parts.year);
  } else if (periodType === 'daily') {
    const yearStr = String(parts.year);
    const monthStr = String(parts.month).padStart(2, '0');
    const dayStr = String(parts.day).padStart(2, '0');
    periodIdentifier = `${yearStr}-${monthStr}-${dayStr}`;
  } else {
    throw new AppError('Unsupported periodType.', 400);
  }

  return getPeriodBoundsAndIdentifier(periodType, periodIdentifier, timeZone);
}

// Resolves the string period identifier for a specific timestamp under a target timezone.
function getPeriodIdentifierForDate(periodType, date, timeZone) {
  const parts = getTzParts(timeZone, date);

  let periodIdentifier;
  if (periodType === 'monthly') {
    const yearStr = String(parts.year);
    const monthStr = String(parts.month).padStart(2, '0');
    periodIdentifier = `${yearStr}-${monthStr}`;
  } else if (periodType === 'weekly') {
    const iso = getISOWeekAndYear(parts.year, parts.month, parts.day);
    const yearStr = String(iso.year);
    const weekStr = String(iso.week).padStart(2, '0');
    periodIdentifier = `${yearStr}-W${weekStr}`;
  } else if (periodType === 'yearly') {
    periodIdentifier = String(parts.year);
  } else if (periodType === 'daily') {
    const yearStr = String(parts.year);
    const monthStr = String(parts.month).padStart(2, '0');
    const dayStr = String(parts.day).padStart(2, '0');
    periodIdentifier = `${yearStr}-${monthStr}-${dayStr}`;
  } else {
    throw new AppError('Unsupported periodType.', 400);
  }

  return periodIdentifier;
}

/**
 * Resolves custom user inputs (week numbers, MM/YYYY, YYYY, or ISO dates) into standard period identifier strings (e.g., YYYY-WXX, YYYY-MM, YYYY).
 */
function resolvePeriodIdentifierFromInput(input, periodType, timeZone) {
  if (!input) return null;
  const str = String(input).trim();

  if (periodType === 'weekly') {
    if (/^\d{1,2}$/.test(str)) {
      const weekNum = parseInt(str, 10);
      const now = new Date();
      const parts = getTzParts(timeZone, now);
      const year = parts.year;
      return `${year}-W${String(weekNum).padStart(2, '0')}`;
    }
    if (/^\d{4}-W\d{2}$/.test(str)) {
      return str;
    }
  } else if (periodType === 'monthly') {
    if (/^\d{2}\/\d{4}$/.test(str)) {
      const [monthStr, yearStr] = str.split('/');
      return `${yearStr}-${monthStr.padStart(2, '0')}`;
    }
    if (/^\d{4}-\d{2}$/.test(str)) {
      return str;
    }
  } else if (periodType === 'yearly') {
    if (/^\d{4}$/.test(str)) {
      return str;
    }
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    const parts = getTzParts(timeZone, date);
    if (periodType === 'monthly') {
      return `${parts.year}-${String(parts.month).padStart(2, '0')}`;
    } else if (periodType === 'weekly') {
      const iso = getISOWeekAndYear(parts.year, parts.month, parts.day);
      return `${iso.year}-W${String(iso.week).padStart(2, '0')}`;
    } else if (periodType === 'yearly') {
      return String(parts.year);
    }
  }

  return null;
}

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

  // Recalculate status dynamically based on new target achievement
  let percent = 0;
  if (assignment.goalValue > 0) {
    percent = Math.min(Math.round((assignment.progress / assignment.goalValue) * 100), 100);
  }

  let status = 'on_track';
  if (percent < 50) {
    status = 'at_risk';
  } else if (percent < 80) {
    status = 'need_attention';
  }

  assignment.status = status;
  await assignment.save();

  // Synchronize history ledger timezone-safely
  try {
    const ownerInfo = await BusinessOwnerInfo.findOne({ userId: businessOwnerId });
    const timeZone = ownerInfo?.timeZone || 'America/New_York';
    const bounds = getCurrentPeriodBoundsAndIdentifier(assignment.resetFrequency || 'weekly', timeZone);

    await KpiHistory.findOneAndUpdate(
      {
        kpiId: assignment.kpiId,
        assignedUserId: assignment.assignedUserId,
        periodIdentifier: bounds.periodIdentifier
      },
      {
        businessOwnerId: assignment.businessOwnerId,
        categoryId: assignment.categoryId,
        roleId: assignment.roleId || null,
        goalValue: assignment.goalValue,
        actualValue: assignment.progress,
        progressPercent: percent,
        periodType: assignment.resetFrequency || 'weekly',
        periodStartDate: bounds.periodStartDate,
        periodEndDate: bounds.periodEndDate,
        status: status
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Error syncing updated KPI Assignment to KPI History:', err);
  }

  const assignmentObj = assignment.toObject();
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

  leaderboard.sort((a, b) => {
    const ratioA = a.goalValue > 0 ? (a.progressValue / a.goalValue) : 0;
    const ratioB = b.goalValue > 0 ? (b.progressValue / b.goalValue) : 0;
    return ratioB - ratioA;
  });

  let currentRank = 1;
  const rankedLeaderboard = leaderboard.map((item, idx) => {
    if (idx > 0) {
      const prev = leaderboard[idx - 1];
      const prevRatio = prev.goalValue > 0 ? (prev.progressValue / prev.goalValue) : 0;
      const currRatio = item.goalValue > 0 ? (item.progressValue / item.goalValue) : 0;

      if (currRatio !== prevRatio) {
        currentRank = currentRank + 1;
      }
    }

    return {
      rank: currentRank,
      ...item
    };
  });

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

/**
 * Service to post or log a new KPI History record.
 * Generates timezone-safe period boundaries automatically based on the period type and identifier.
 * Synchronizes the active KpiAssignment record if the posted period is currently active.
 */
exports.kpiHistoryPostService = async (businessOwnerId, payload) => {
  const { kpiId, assignedUserId, periodType, periodIdentifier, actualValue, goalValue } = payload;

  if (!mongoose.Types.ObjectId.isValid(kpiId) || !mongoose.Types.ObjectId.isValid(assignedUserId)) {
    throw new AppError('Invalid KPI ID or Employee ID format.', 400);
  }

  const kpiExists = await Kpi.findOne({ _id: kpiId, businessOwnerId });
  if (!kpiExists) {
    throw new AppError('KPI not found or unauthorized access.', 404);
  }

  const employeeInfo = await EmployeeInfo.findOne({ userId: assignedUserId, businessOwnerId, isDeleted: false });
  if (!employeeInfo) {
    throw new AppError('Employee not found or does not belong to this business.', 404);
  }

  const ownerInfo = await BusinessOwnerInfo.findOne({ userId: businessOwnerId });
  const timeZone = ownerInfo?.timeZone || 'America/New_York';

  const { periodStartDate, periodEndDate } = getPeriodBoundsAndIdentifier(periodType, periodIdentifier, timeZone);

  const progressPercent = goalValue > 0 ? Math.min(Math.round((actualValue / goalValue) * 100), 100) : 0;

  let status = 'on_track';
  if (progressPercent < 50) {
    status = 'at_risk';
  } else if (progressPercent < 80) {
    status = 'need_attention';
  }

  const historyRecord = await KpiHistory.findOneAndUpdate(
    {
      kpiId,
      assignedUserId,
      periodIdentifier
    },
    {
      businessOwnerId,
      categoryId: kpiExists.categoryId,
      roleId: employeeInfo.employeeRoleId || null,
      goalValue,
      actualValue,
      progressPercent,
      periodType,
      periodStartDate,
      periodEndDate,
      status
    },
    { upsert: true, new: true }
  );

  const now = new Date();
  if (now >= periodStartDate && now <= periodEndDate) {
    await KpiAssignment.findOneAndUpdate(
      {
        businessOwnerId,
        kpiId,
        assignedUserId
      },
      {
        categoryId: kpiExists.categoryId,
        roleId: employeeInfo.employeeRoleId || null,
        goalValue,
        progress: actualValue,
        status,
        resetFrequency: periodType
      },
      { upsert: true }
    );
  }

  return historyRecord;
};

/**
 * Service to retrieve the hierarchical performance trends grouped by KPI, sorted chronologically.
 * Supports timezone-safe period formats, optional date boundaries, and regex KPI search filtering.
 */
exports.kpiHistoryGetService = async (businessOwnerId, query = {}) => {
  const { periodType, search, page, limit } = query;

  if (!periodType) {
    throw new AppError('periodType is a required query parameter.', 400);
  }

  const matchStage = {
    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
    resetFrequency: periodType
  };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'kpis',
        localField: 'kpiId',
        foreignField: '_id',
        as: 'kpiDetails'
      }
    },
    { $unwind: '$kpiDetails' }
  ];

  if (search?.trim()) {
    pipeline.push({
      $match: {
        'kpiDetails.kpiName': { $regex: search.trim(), $options: 'i' }
      }
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'measurementtypes',
        localField: 'kpiDetails.measurementType',
        foreignField: '_id',
        as: 'measurementTypeData'
      }
    },
    { $unwind: { path: '$measurementTypeData', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedUserId',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    { $unwind: '$userDetails' },
    {
      $group: {
        _id: '$kpiId',
        kpiName: { $first: '$kpiDetails.kpiName' },
        measurementType: { $first: '$measurementTypeData.name' },
        measurementSymbol: { $first: '$measurementTypeData.symbol' },
        metrics: {
          $push: {
            employeeId: '$assignedUserId',
            employeeName: '$userDetails.name',
            profileImage: { $ifNull: ['$userDetails.userProfile.url', ''] },
            actual: '$progress',
            goal: '$goalValue',
            progressPercent: {
              $cond: {
                if: { $gt: ['$goalValue', 0] },
                then: { $min: [{ $round: [{ $multiply: [{ $divide: ['$progress', '$goalValue'] }, 100] }, 0] }, 100] },
                else: 0
              }
            },
            status: '$status'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        kpiId: '$_id',
        kpiName: 1,
        measurementType: 1,
        measurementSymbol: 1,
        metrics: 1
      }
    },
    { $sort: { kpiName: 1 } }
  );

  const result = await KpiAssignment.aggregate(pipeline);

  const total = result.length;
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;
  const skip = (parsedPage - 1) * parsedLimit;
  const paginatedResult = result.slice(skip, skip + parsedLimit);

  const ownerInfo = await BusinessOwnerInfo.findOne({ userId: businessOwnerId });
  const timeZone = ownerInfo?.timeZone || 'America/New_York';
  const bounds = getCurrentPeriodBoundsAndIdentifier(periodType, timeZone);

  const data = paginatedResult.map((kpi) => {
    let periodName = bounds.periodIdentifier;

    if (periodType === 'monthly') {
      const [yearStr, monthStr] = bounds.periodIdentifier.split('-');
      const date = new Date(Date.UTC(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1));
      periodName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    } else if (periodType === 'weekly') {
      const weekStr = bounds.periodIdentifier.split('-W')[1];
      const startParts = getTzParts(timeZone, bounds.periodStartDate);
      const dateStr = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day)).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
      periodName = `Week ${parseInt(weekStr, 10)} (${dateStr})`;
    } else if (periodType === 'yearly') {
      periodName = bounds.periodIdentifier;
    } else if (periodType === 'daily') {
      const [yearStr, monthStr, dayStr] = bounds.periodIdentifier.split('-');
      const date = new Date(Date.UTC(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10)));
      periodName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    }

    return {
      kpiId: kpi.kpiId,
      kpiName: kpi.kpiName,
      measurementType: kpi.measurementType,
      measurementSymbol: kpi.measurementSymbol,
      history: [
        {
          periodIdentifier: bounds.periodIdentifier,
          periodName,
          startDate: bounds.periodStartDate,
          endDate: bounds.periodEndDate,
          metrics: kpi.metrics
        }
      ]
    };
  });

  return {
    data,
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit)
  };
};

exports.employeeKpiHistoryGetService = async (assignedUserId, businessOwnerId, query = {}) => {
  const { periodType, startDate, endDate, search, page, limit } = query;

  if (!periodType) {
    throw new AppError('periodType is a required query parameter.', 400);
  }

  const employeeInfo = await EmployeeInfo.findOne({ userId: assignedUserId });
  const timeZone = employeeInfo?.timeZone || 'America/New_York';

  const matchStage = {
    assignedUserId: new mongoose.Types.ObjectId(assignedUserId),
    businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId),
    periodType: periodType
  };

  const startPeriod = resolvePeriodIdentifierFromInput(startDate, periodType, timeZone);
  const endPeriod = resolvePeriodIdentifierFromInput(endDate, periodType, timeZone);

  if (startPeriod || endPeriod) {
    const conditions = [];
    if (startPeriod) {
      conditions.push({ periodIdentifier: { $gte: startPeriod } });
    }
    if (endPeriod) {
      conditions.push({ periodIdentifier: { $lte: endPeriod } });
    }
    matchStage.$and = conditions;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'kpis',
        localField: 'kpiId',
        foreignField: '_id',
        as: 'kpiDetails'
      }
    },
    { $unwind: '$kpiDetails' }
  ];

  if (search?.trim()) {
    pipeline.push({
      $match: {
        'kpiDetails.kpiName': { $regex: search.trim(), $options: 'i' }
      }
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'measurementtypes',
        localField: 'kpiDetails.measurementType',
        foreignField: '_id',
        as: 'measurementTypeData'
      }
    },
    { $unwind: { path: '$measurementTypeData', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$kpiId',
        kpiName: { $first: '$kpiDetails.kpiName' },
        measurementType: { $first: '$measurementTypeData.name' },
        measurementSymbol: { $first: '$measurementTypeData.symbol' },
        history: {
          $push: {
            periodIdentifier: '$periodIdentifier',
            startDate: '$periodStartDate',
            endDate: '$periodEndDate',
            actual: '$actualValue',
            goal: '$goalValue',
            progressPercent: '$progressPercent',
            status: '$status'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        kpiId: '$_id',
        kpiName: 1,
        measurementType: 1,
        measurementSymbol: 1,
        history: 1
      }
    },
    { $sort: { kpiName: 1 } }
  );

  const result = await KpiHistory.aggregate(pipeline);

  const total = result.length;
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;
  const skip = (parsedPage - 1) * parsedLimit;
  const paginatedResult = result.slice(skip, skip + parsedLimit);

  const data = paginatedResult.map((kpi) => {
    kpi.history.sort((a, b) => a.periodIdentifier.localeCompare(b.periodIdentifier));
    kpi.history = kpi.history.map((hist) => {
      let periodName = hist.periodIdentifier;
      if (periodType === 'monthly') {
        const [year, month] = hist.periodIdentifier.split('-');
        const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
        periodName = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        });
      } else if (periodType === 'weekly') {
        const weekNum = hist.periodIdentifier.split('-W')[1];
        const startParts = getTzParts(timeZone, hist.startDate);
        const dateStr = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day)).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        });
        periodName = `Week ${parseInt(weekNum, 10)} (${dateStr})`;
      } else if (periodType === 'yearly') {
        periodName = hist.periodIdentifier;
      }
      return {
        ...hist,
        periodName
      };
    });
    return kpi;
  });

  return {
    data,
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit)
  };
};

/**
 * Timezone-safe KPI Rollover Engine
 * --------------------------------
 * Performs a cursor-based aggregation scan over active KPI assignments to identify 
 * and process boundary rollovers (daily, weekly, monthly, yearly) inside database layers.
 * Offloads N+1 timezone fetches and vectorizes writes via MongoDB bulk operations.
 * 
 * Database Dependencies:
 * - Reads: KpiAssignment, EmployeeInfo, BusinessOwnerInfo (via pipeline $lookup)
 * - Writes: KpiHistory (Bulk Upsert), KpiAssignment (Bulk Update/Delete)
 * 
 * Parameters: None
 * Returns: Promise<Object> { resetCount: Number, deleteCount: Number }
 */
exports.processKpiRollovers = async () => {
  let resetCount = 0;
  let deleteCount = 0;

  const pipeline = [
    {
      $lookup: {
        from: 'employeeinfos',
        localField: 'assignedUserId',
        foreignField: 'userId',
        as: 'employeeInfo'
      }
    },
    {
      $unwind: {
        path: '$employeeInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'businessownerinfos',
        localField: 'businessOwnerId',
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
        _id: 1,
        businessOwnerId: 1,
        categoryId: 1,
        kpiId: 1,
        goalValue: 1,
        resetFrequency: 1,
        isRepeat: 1,
        progress: 1,
        roleId: 1,
        status: 1,
        assignedUserId: 1,
        createdAt: 1,
        updatedAt: 1,
        employeeTz: '$employeeInfo.timeZone',
        ownerTz: '$businessOwnerInfo.timeZone'
      }
    }
  ];

  const batchSize = 1000;
  const cursor = KpiAssignment.aggregate(pipeline).cursor({ batchSize });

  let historyOps = [];
  let updateOps = [];
  let deleteOps = [];

  const flushBatches = async () => {
    if (historyOps.length > 0) {
      await KpiHistory.bulkWrite(historyOps, { ordered: false });
      historyOps = [];
    }
    if (updateOps.length > 0) {
      await KpiAssignment.bulkWrite(updateOps, { ordered: false });
      updateOps = [];
    }
    if (deleteOps.length > 0) {
      await KpiAssignment.bulkWrite(deleteOps, { ordered: false });
      deleteOps = [];
    }
  };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      const {
        _id,
        businessOwnerId,
        categoryId,
        kpiId,
        goalValue,
        resetFrequency,
        isRepeat,
        progress,
        roleId,
        status,
        assignedUserId,
        updatedAt,
        createdAt,
        employeeTz,
        ownerTz
      } = doc;

      if (!assignedUserId || !businessOwnerId) continue;

      let timeZone = (employeeTz || ownerTz || 'America/New_York').trim();
      try {
        new Intl.DateTimeFormat('en-US', { timeZone });
      } catch (e) {
        timeZone = 'America/New_York';
      }

      const frequency = resetFrequency || 'weekly';
      const currentPeriodId = getPeriodIdentifierForDate(frequency, new Date(), timeZone);
      const assignmentPeriodId = getPeriodIdentifierForDate(frequency, updatedAt || createdAt, timeZone);

      if (assignmentPeriodId !== currentPeriodId) {
        const archiveBounds = getPeriodBoundsAndIdentifier(frequency, assignmentPeriodId, timeZone);
        const progressPercent = goalValue > 0 
          ? Math.min(Math.round((progress / goalValue) * 100), 100) 
          : 0;

        historyOps.push({
          updateOne: {
            filter: {
              kpiId,
              assignedUserId,
              periodIdentifier: assignmentPeriodId
            },
            update: {
              $set: {
                businessOwnerId,
                categoryId,
                roleId: roleId || null,
                goalValue,
                actualValue: progress,
                progressPercent,
                periodType: frequency,
                periodStartDate: archiveBounds.periodStartDate,
                periodEndDate: archiveBounds.periodEndDate,
                status
              }
            },
            upsert: true
          }
        });

        if (isRepeat === true || isRepeat === 'true') {
          updateOps.push({
            updateOne: {
              filter: { _id },
              update: {
                $set: {
                  progress: 0,
                  status: 'on_track'
                }
              }
            }
          });
          resetCount++;
        } else {
          deleteOps.push({
            deleteOne: {
              filter: { _id }
            }
          });
          deleteCount++;
        }

        if (historyOps.length >= batchSize || updateOps.length >= batchSize || deleteOps.length >= batchSize) {
          await flushBatches();
        }
      }
    } catch (err) {
      console.error(`Error processing aggregate rollover record:`, err);
    }
  }

  await flushBatches();

  return { resetCount, deleteCount };
};

exports.getTzParts = getTzParts;
exports.localToUtc = localToUtc;
exports.getISOWeekAndYear = getISOWeekAndYear;
exports.getPeriodBoundsAndIdentifier = getPeriodBoundsAndIdentifier;
exports.getCurrentPeriodBoundsAndIdentifier = getCurrentPeriodBoundsAndIdentifier;
exports.getPeriodIdentifierForDate = getPeriodIdentifierForDate;
