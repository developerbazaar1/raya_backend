const Meeting = require('../models/businessOwner/meeting.model');
const User = require('../models/shared/users.model');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');
const AppError = require('../utils/appError');

exports.createMeetingService = async (data, userId) => {
  const { title, date, startTime, endTime, invitedMembers } = data;
  const meeting = await Meeting.create({
    businessOwnerId: userId,
    createdByUserId: userId,
    title,
    date,
    startTime,
    endTime,
    invitedMembers
  });

  const formattedMeeting = {
    id: meeting._id,
    businessOwnerId: meeting.businessOwnerId,
    createdByUserId: meeting.createdByUserId,
    title: meeting.title || '',
    date: meeting.date || '',
    startTime: meeting.startTime || '',
    endTime: meeting.endTime || '',
    invitedMembers: meeting.invitedMembers || []
  };
  return formattedMeeting;
};

exports.allMeetingService = async (userId, query) => {
  const { year, month } = query;
  const user = await User.findById(userId);

  const filter = { businessOwnerId: userId };

  if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (year) {
    const y = parseInt(year, 10);
    const startDate = new Date(Date.UTC(y, 0, 1));
    const endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    filter.date = { $gte: startDate, $lte: endDate };
  }
  const meetings = await Meeting.find(filter).populate([
    {
      path: 'invitedMembers',
      select: '_id name userProfile'
    }
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
  return formattedMeetings;
};
