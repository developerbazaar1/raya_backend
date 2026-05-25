const mongoose = require('mongoose');
const Meeting = require('../../models/businessOwner/meeting.model');
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
 * Business Owner Meeting List
 */
exports.meetingListService = async (businessOwnerId, query) => {
  let { year, month, page = 1, limit = 10 } = query;

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

  const filter = {
    businessOwnerId: businessOwnerObjectId
  };

  // Date filtering
  if (year || month) {
    const currentYear = new Date().getFullYear();

    const targetYear = year ? parseInt(year, 10) : currentYear;

    if (month) {
      const targetMonth = parseInt(month, 10);

      const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);

      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    } else {
      const startDate = new Date(targetYear, 0, 1, 0, 0, 0, 0);

      const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
  }

  // Fetch meetings
  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate({
        path: 'invitedMembers',
        select: '_id name userProfile'
      })
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit),

    Meeting.countDocuments(filter)
  ]);

  // Format response
  const formattedMeetings = meetings.map((meeting) => ({
    id: meeting._id,
    businessOwnerId: meeting.businessOwnerId,
    createdByUserId: meeting.createdByUserId,
    title: meeting.title || '',
    date: meeting.date || '',
    startTime: meeting.startTime || '',
    endTime: meeting.endTime || '',
    createdAt: meeting.createdAt,

    invitedMembers: (meeting.invitedMembers || []).map((member) => ({
      id: member._id,
      name: member.name || '',

      profilePicture: member.userProfile?.url || DEFAULT_PROFILE_IMAGE
    }))
  }));

  return {
    items: formattedMeetings,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Employee Meeting List
 */
exports.meetingListEmployeeService = async (employeeId, query) => {
  let { page = 1, limit = 10 } = query || {};

  // Validate employee ID
  const employeeObjectId = validateObjectId(employeeId, 'Employee ID');

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

  // Fetch meetings
  const [meetings, total] = await Promise.all([
    Meeting.find({
      invitedMembers: employeeObjectId
    })
      .populate('businessOwnerId', 'name')
      .populate('createdByUserId', 'name')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit),

    Meeting.countDocuments({
      invitedMembers: employeeObjectId
    })
  ]);

  if (!meetings.length) {
    throw new AppError('No meetings found for this employee', 404);
  }

  // Format response
  const formattedMeetings = meetings.map((meeting) => ({
    id: meeting._id,

    businessOwnerName: meeting.businessOwnerId?.name || '',

    createdByName: meeting.createdByUserId?.name || '',

    title: meeting.title || '',
    date: meeting.date || '',
    startTime: meeting.startTime || '',
    endTime: meeting.endTime || ''
  }));

  return {
    items: formattedMeetings,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};
