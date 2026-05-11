const TimeOffRequest = require('../../models/businessOwnerTeam/timeOffRequests.model');
const EmployeeLeaveBalance = require('../../models/businessOwnerTeam/employeeLeaveBalances.model');
const BusinessOwnerInfo = require('../../models/businessOwner/businessOwnerInfo.model');
const User = require('../../models/shared/users.model');
const AppError = require('../../utils/appError');

const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

exports.createTimeOffRequest = async (body, userId) => {
  const { reason, startDate, endDate, fullDay, halfDay } = body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const totalalloted = await BusinessOwnerInfo.findOne({ userId: user.owner }).select(
    'totalTimeOff'
  );
  const allottedDays = totalalloted ? totalalloted.totalTimeOff : 15;

  const timeOffRequest = new TimeOffRequest({
    reason,
    startDate,
    endDate,
    fullDay,
    halfDay,
    employeeId: userId,
    businessOwnerId: user.owner,
    status: 'pending',
    totalDays: calculateTotalDays(startDate, endDate)
  });

  await timeOffRequest.save();

  // Update or create EmployeeLeaveBalance
  let leaveBalance = await EmployeeLeaveBalance.findOne({ employeeId: userId });

  // Calculate total approved days
  const approvedRequests = await TimeOffRequest.find({
    employeeId: userId,
    status: 'approved'
  });
  const usedDays = approvedRequests.reduce((sum, req) => sum + (req.totalDays || 0), 0);

  if (!leaveBalance) {
    leaveBalance = new EmployeeLeaveBalance({
      employeeId: userId,
      totalAllocated: allottedDays,
      usedDays: usedDays,
      remainingDays: allottedDays - usedDays
    });
  } else {
    leaveBalance.totalAllocated = allottedDays;
    leaveBalance.usedDays = usedDays;
    leaveBalance.remainingDays = allottedDays - usedDays;
  }

  await leaveBalance.save();

  return timeOffRequest;
};

exports.getTimeOffRequest = async (userId) => {
  const timeOffRequests = await TimeOffRequest.find({ employeeId: userId })
    .select('reason startDate endDate totalDays status suggestedDate ownerComment businessOwnerId')
    .populate('businessOwnerId', 'name')
    .sort({ createdAt: -1 });

  // Fetch leave balance summary
  const leaveBalance = await EmployeeLeaveBalance.findOne({ employeeId: userId });

  // Calculate total availed (Only Approved)
  const leaveAvailed = timeOffRequests
    .filter((req) => req.status === 'approved')
    .reduce((sum, req) => sum + (req.totalDays || 0), 0);

  const summary = {
    totalAllotted: leaveBalance ? leaveBalance.totalAllocated : 0,
    leaveAvailed: leaveAvailed,
    remainingDays: leaveBalance ? leaveBalance.totalAllocated - leaveAvailed : 0
  };

  return {
    summary,
    requests: timeOffRequests
  };
};

exports.updateNewChangeOffRequest = async (body, timeOffRequestId) => {
  const { startDate, endDate } = body;

  console.log("body", body)
  console.log("id", timeOffRequestId)
  const timeOffRequest = await TimeOffRequest.findById(timeOffRequestId);

  if (!timeOffRequest) {
    throw new AppError('Time off request not found', 404);
  }


  if (timeOffRequest.status !== 'change_requested') {
    throw new AppError('Only requests with "change_requested" status can be updated', 400);
  }

  timeOffRequest.status = 'change_requested';
  timeOffRequest.startDate = startDate;
  timeOffRequest.endDate = endDate;
  timeOffRequest.totalDays = calculateTotalDays(startDate, endDate);

  await timeOffRequest.save();
  return timeOffRequest;
};


exports.deleteTimeOffRequest = async (timeOffRequestId) => {
  const timeOffRequest = await TimeOffRequest.findByIdAndDelete(timeOffRequestId);

  if (!timeOffRequest) {
    throw new AppError('Time off request not found', 404);
  }

  if (timeOffRequest.status !== 'pending') {
    throw new AppError('Only "pending" status requests can be deleted', 400);
  }

  return timeOffRequest;
};
