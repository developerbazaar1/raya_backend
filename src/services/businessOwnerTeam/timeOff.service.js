const mongoose = require('mongoose');

const TimeOffRequest = require('../../models/businessOwnerTeam/timeOffRequests.model');
const EmployeeLeaveBalance = require('../../models/businessOwnerTeam/employeeLeaveBalances.model');
const BusinessOwnerInfo = require('../../models/businessOwner/businessOwnerInfo.model');
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

/**
 * Calculate Total Days
 */
const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = Math.abs(end - start);

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Create Time Off Request
 */
exports.createTimeOffRequest = async (body, userId) => {
  const { reason, startDate, endDate, fullDay, halfDay } = body;

  const userObjectId = validateObjectId(userId, 'User ID');

  const user = await User.findById(userObjectId).select('owner');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const businessOwner = await BusinessOwnerInfo.findOne({
    userId: user.owner
  }).select('totalTimeOff');

  const allottedDays = businessOwner?.totalTimeOff || 15;

  const totalDays = calculateTotalDays(startDate, endDate);

  const timeOffRequest = await TimeOffRequest.create({
    reason,
    startDate,
    endDate,
    fullDay,
    halfDay,

    employeeId: userObjectId,
    businessOwnerId: user.owner,

    status: 'pending',
    totalDays
  });

  /**
   * Leave Balance
   */
  let leaveBalance = await EmployeeLeaveBalance.findOne({
    employeeId: userObjectId
  });

  const approvedRequests = await TimeOffRequest.find({
    employeeId: userObjectId,
    status: 'approved'
  }).select('totalDays');

  const usedDays = approvedRequests.reduce((sum, request) => sum + (request.totalDays || 0), 0);

  const remainingDays = allottedDays - usedDays;

  if (!leaveBalance) {
    leaveBalance = new EmployeeLeaveBalance({
      employeeId: userObjectId,
      totalAllocated: allottedDays,
      usedDays,
      remainingDays
    });
  } else {
    leaveBalance.totalAllocated = allottedDays;
    leaveBalance.usedDays = usedDays;
    leaveBalance.remainingDays = remainingDays;
  }

  await leaveBalance.save();

  return timeOffRequest;
};

/**
 * Get Time Off Requests
 */
exports.getTimeOffRequest = async (userId) => {
  const userObjectId = validateObjectId(userId, 'User ID');

  const timeOffRequests = await TimeOffRequest.find({
    employeeId: userObjectId
  })
    .select('reason startDate endDate totalDays status suggestedDate ownerComment businessOwnerId')
    .populate('businessOwnerId', 'name')
    .sort({ createdAt: -1 });

  const leaveBalance = await EmployeeLeaveBalance.findOne({
    employeeId: userObjectId
  });

  const leaveAvailed = timeOffRequests
    .filter((request) => request.status === 'approved')
    .reduce((sum, request) => sum + (request.totalDays || 0), 0);

  const totalAllotted = leaveBalance?.totalAllocated || 0;

  return {
    summary: {
      totalAllotted,
      leaveAvailed,
      remainingDays: totalAllotted - leaveAvailed
    },

    requests: timeOffRequests
  };
};

/**
 * Update Change Requested Time Off
 */
exports.updateNewChangeOffRequest = async (body, timeOffRequestId) => {
  const { startDate, endDate } = body;

  const requestObjectId = validateObjectId(timeOffRequestId, 'Time Off Request ID');

  const timeOffRequest = await TimeOffRequest.findById(requestObjectId);

  if (!timeOffRequest) {
    throw new AppError('Time off request not found', 404);
  }

  if (timeOffRequest.status !== 'change_requested') {
    throw new AppError('Only requests with "change_requested" status can be updated', 400);
  }

  timeOffRequest.startDate = startDate;
  timeOffRequest.endDate = endDate;
  timeOffRequest.totalDays = calculateTotalDays(startDate, endDate);

  await timeOffRequest.save();

  return timeOffRequest;
};

/**
 * Delete Time Off Request
 */
exports.deleteTimeOffRequest = async (timeOffRequestId) => {
  const requestObjectId = validateObjectId(timeOffRequestId, 'Time Off Request ID');

  const timeOffRequest = await TimeOffRequest.findById(requestObjectId);

  if (!timeOffRequest) {
    throw new AppError('Time off request not found', 404);
  }

  if (timeOffRequest.status !== 'pending') {
    throw new AppError('Only "pending" status requests can be deleted', 400);
  }

  await TimeOffRequest.findByIdAndDelete(requestObjectId);

  return {
    message: 'Time off request deleted successfully'
  };
};
