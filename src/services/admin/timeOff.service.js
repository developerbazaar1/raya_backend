const mongoose = require('mongoose');
const User = require('../../models/shared/users.model');
const TimeOffRequest = require('../../models/businessOwnerTeam/timeOffRequests.model');
const EmployeeLeaveBalance = require('../../models/businessOwnerTeam/employeeLeaveBalances.model');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');
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
 * Validate Employee
 */
const validateEmployee = async (employeeId) => {
  // Validate ObjectId
  const employeeObjectId = validateObjectId(employeeId, 'Employee ID');

  // Check employee exists
  const employee = await User.findById(employeeObjectId);

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Validate role
  if (employee.role !== 'employee') {
    throw new AppError('User is not an employee', 400);
  }

  return employeeObjectId;
};

/**
 * Business Owner Time-Off Request List
 */
exports.timeOffRequestListService = async (businessOwnerId, query) => {
  let { status, search, page = 1, limit = 10 } = query;

  // Validate business owner ID
  const businessOwnerObjectId = validateObjectId(businessOwnerId, 'Business Owner ID');

  // Parse pagination
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  // Pagination validation
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  // Filters
  const filter = {
    businessOwnerId: businessOwnerObjectId
  };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.reason = {
      $regex: search,
      $options: 'i'
    };
  }

  // Fetch requests
  const [timeOffRequests, total] = await Promise.all([
    TimeOffRequest.find(filter)
      .populate('employeeId', 'name userProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    TimeOffRequest.countDocuments(filter)
  ]);

  // Format response
  const formattedRequests = timeOffRequests.map((timeOff) => ({
    id: timeOff._id,
    name: timeOff.employeeId?.name || '',
    userProfile: timeOff.employeeId?.userProfile?.url || DEFAULT_PROFILE_IMAGE,
    startDate: timeOff.startDate || '',
    endDate: timeOff.endDate || '',
    reason: timeOff.reason || '',
    status: timeOff.status || '',
    totalDays: timeOff.totalDays || 0
  }));

  return {
    items: formattedRequests,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Employee Time-Off Request List
 */
exports.timeOffRequestEmployeeListService = async (employeeId, query) => {
  let { page = 1, limit = 10 } = query || {};

  // Validate employee
  const employeeObjectId = await validateEmployee(employeeId);

  // Parse pagination
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  // Pagination validation
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  // Fetch requests
  const [timeOffRequests, total] = await Promise.all([
    TimeOffRequest.find({
      employeeId: employeeObjectId
    })
      .select(
        `
            reason
            startDate
            endDate
            totalDays
            status
            suggestedDate
            ownerComment
            businessOwnerId
          `
      )
      .populate('businessOwnerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    TimeOffRequest.countDocuments({
      employeeId: employeeObjectId
    })
  ]);

  if (!timeOffRequests.length) {
    throw new AppError('Time off requests not found', 404);
  }

  // Fetch leave balance
  const leaveBalance = await EmployeeLeaveBalance.findOne({
    employeeId: employeeObjectId
  });

  // Calculate approved leaves
  const leaveAvailed = timeOffRequests
    .filter((request) => request.status === 'approved')
    .reduce((sum, request) => sum + (request.totalDays || 0), 0);

  // Leave summary
  const summary = {
    totalAllotted: leaveBalance?.totalAllocated || 0,
    leaveAvailed,
    remainingDays: (leaveBalance?.totalAllocated || 0) - leaveAvailed
  };

  // Format response
  const formattedRequests = timeOffRequests.map((request) => ({
    id: request._id,
    businessOwnerName: request.businessOwnerId?.name || '',
    reason: request.reason || '',
    startDate: request.startDate || '',
    endDate: request.endDate || '',
    totalDays: request.totalDays || 0,
    status: request.status || '',
    suggestedDate: request.suggestedDate || '',
    ownerComment: request.ownerComment || ''
  }));

  return {
    summary,
    items: formattedRequests,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};
