const TimeOffRequest = require('../models/businessOwnerTeam/timeOffRequests.model');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');
const AppError = require('../utils/appError');


exports.getAllTimeOffsService = async (query, userId) => {
    const { status, search } = query;
    const filter = { businessOwnerId: userId };

    if (status) {
        filter.status = status;
    }

    if (search) {
        filter.reason = { $regex: search, $options: 'i' };
    }

    const timeOffs = await TimeOffRequest.find(filter)
        .populate('employeeId', 'name  userProfile')
        .sort({ createdAt: -1 });

    const formattedTimeOffs = timeOffs.map(timeOff => ({
        id: timeOff._id,
        name: timeOff.employeeId ? timeOff.employeeId.name : 'Unknown',
        userProfile: (timeOff.employeeId && timeOff.employeeId.userProfile && timeOff.employeeId.userProfile.url)
            ? timeOff.employeeId.userProfile.url
            : DEFAULT_PROFILE_IMAGE,
        startDate: timeOff.startDate,
        endDate: timeOff.endDate,
        reason: timeOff.reason,
        status: timeOff.status,
        totalDays: timeOff.totalDays
    }));

    return formattedTimeOffs;
}

exports.updateTimeOffRequestService = async (timeOffId, payload, userId) => {
    const timeOffRequest = await TimeOffRequest.findById(timeOffId);

    if (!timeOffRequest) {
        throw new AppError('Time off request not found', 404);
    }

    // Authorization check
    if (timeOffRequest.businessOwnerId.toString() !== userId.toString()) {
        throw new AppError('You are not authorized to update this time off request', 403);
    }

    // Update fields
    const allowedFields = ['status', 'ownerComment', 'suggestedDate'];
    allowedFields.forEach(field => {
        if (payload[field] !== undefined) {
            timeOffRequest[field] = payload[field];
        }
    });

    await timeOffRequest.save();

    return timeOffRequest;
}