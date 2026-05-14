const mongoose = require('mongoose');
const Event = require('../models/businessOwnerTeam/event.model');
const User = require('../models/shared/users.model');
const Meeting = require('../models/businessOwner/meeting.model');
const AppError = require('../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');

exports.eventCreateService = async (body, userId) => {
  const { eventName, date, startTime, endTime, favorite } = body;

  const event = new Event({
    eventName,
    date,
    startTime,
    endTime,
    favorite,
    businessOwnerId: userId,
    createdByUserId: userId
  });
  await event.save();

  const formattedevent = {
    id: event._id,
    eventName: event.eventName || '',
    date: event.date || '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    favorite: event.favorite || '',
    createdByUserId: event.createdByUserId || ''
  };
  return formattedevent;
};

exports.eventGetService = async (userId, query = {}) => {
  let { year, month, page = 1, limit = 10 } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const filter = { businessOwnerId: userId };

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

  const [events, total] = await Promise.all([
    Event.find(filter)
      .select('eventName date startTime endTime favorite createdByUserId createdAt')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter)
  ]);

  const formattedEvents = events.map((event) => ({
    id: event._id,
    eventName: event.eventName || '',
    date: event.date || '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    favorite: event.favorite || '',
    createdByUserId: event.createdByUserId || '',
    createdAt: event.createdAt || ''
  }));

  return {
    data: formattedEvents,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

exports.eventHistoryGetService = async (userId) => {
  const meetings = await Meeting.find({
    businessOwnerId: userId,
    date: { $lt: new Date() }
  })
    .sort({ date: -1 })
    .select('title date invitedMembers notes createdAt')
    .populate('invitedMembers', 'name userProfile');

  const formattedmeetings = meetings.map((meeting) => ({
    id: meeting._id,
    title: meeting.title || '',
    date: meeting.date || '',
    invitedMembers: (meeting.invitedMembers || []).map((member) => ({
      id: member._id,
      profileImage: member.userProfile?.url || DEFAULT_PROFILE_IMAGE
    })),
    notes: meeting.notes || '',
    createdAt: meeting.createdAt || ''
  }));
  return formattedmeetings;
};

exports.noteCreateService = async (meetingId, body, userId) => {
  const { notes } = body;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  const updateNote = await Meeting.findByIdAndUpdate(
    meetingId,
    {
      notes
    },
    { new: true }
  );

  const formattednote = {
    id: updateNote._id,
    notes: updateNote.notes || '',
    businessOwnerId: updateNote.businessOwnerId || '',
    createdByUserId: updateNote.createdByUserId || '',
    createdAt: updateNote.createdAt || ''
  };
  return formattednote;
};

exports.eventDeleteService = async (eventId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new AppError('Invalid event ID format', 400);
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.businessOwnerId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to delete this event', 401);
  }

  await Event.findByIdAndDelete(eventId);
  return {};
};
