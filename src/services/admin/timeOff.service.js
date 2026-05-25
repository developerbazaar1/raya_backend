const TimeOffRequest = require('../../models/businessOwnerTeam/timeOffRequests.model');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');
const AppError = require('../../utils/appError');

exports.timeOffRequestListService = async (businessOwnerId,query) => {
  let { status, search, page = 1, limit = 10 } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const filter = { businessOwnerId: businessOwnerId };

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
    items: formattedTimeOffs,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};
