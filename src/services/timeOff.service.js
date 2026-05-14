const TimeOffRequest = require('../models/businessOwnerTeam/timeOffRequests.model');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');
const AppError = require('../utils/appError');

exports.getAllTimeOffsService = async (query = {}, userId) => {
  let { status, search, page = 1, limit = 10 } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const filter = { businessOwnerId: userId };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.reason = { $regex: search, $options: 'i' };
  }

  const [timeOffs, total] = await Promise.all([
    TimeOffRequest.find(filter)
      .populate('employeeId', 'name userProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    TimeOffRequest.countDocuments(filter)
  ]);

  const formattedTimeOffs = timeOffs.map((timeOff) => ({
    id: timeOff._id,
    name: timeOff.employeeId ? timeOff.employeeId.name : '',
    userProfile:
      timeOff.employeeId && timeOff.employeeId.userProfile && timeOff.employeeId.userProfile.url
        ? timeOff.employeeId.userProfile.url
        : DEFAULT_PROFILE_IMAGE,
    startDate: timeOff.startDate,
    endDate: timeOff.endDate,
    reason: timeOff.reason,
    status: timeOff.status,
    totalDays: timeOff.totalDays
  }));

  return {
    data: formattedTimeOffs,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

exports.updateTimeOffRequestService = async (timeOffId, payload, userId) => {
  const timeOffRequest = await TimeOffRequest.findById(timeOffId);

  if (!timeOffRequest) {
    throw new AppError('Time off request not found', 404);
  }
  if (timeOffRequest.businessOwnerId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to update this time off request', 403);
  }
  const allowedFields = ['status', 'ownerComment', 'suggestedDate'];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      timeOffRequest[field] = payload[field];
    }
  });
  await timeOffRequest.save();
  return timeOffRequest;
};
