const Meeting = require('../../models/businessOwner/meeting.model');

const User = require('../../models/shared/users.model');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');
const AppError = require('../../utils/appError');

exports.meetingListService = async (businessOwnerId, query) => {
  let { year, month, page = 1, limit = 10 } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const filter = { businessOwnerId: businessOwnerId };

  if (year || month) {
    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(year, 10) : currentYear;

    if (month) {
      const targetMonth = parseInt(month, 10);
      // Start of the month
      const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
      // End of the month
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // Just year
      const startDate = new Date(targetYear, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
  }

  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate([
        {
          path: 'invitedMembers',
          select: '_id name userProfile'
        }
      ])
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit),
    Meeting.countDocuments(filter)
  ]);

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
      profilePicture:
        member.userProfile && member.userProfile.url
          ? member.userProfile.url
          : DEFAULT_PROFILE_IMAGE
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
