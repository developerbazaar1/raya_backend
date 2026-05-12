const Event = require('../models/businessOwnerTeam/event.model');
const User = require('../models/shared/users.model');
const Meeting = require('../models/businessowner/meeting.model');
const AppError = require('../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');


//create Event Service
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

//Get All Events List Service
exports.eventGetService = async (userId, query) => {
  const { year, month } = query;

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

  const events = await Event.find(filter).select(
    'eventName date startTime endTime favorite createdByUserId createdAt'
  );

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
  return formattedEvents;
};

//Get All Meet History Service
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
      profileImage: member.userProfile?.url || DEFAULT_PROFILE_IMAGE,
    })),
    notes: meeting.notes || '',
    createdAt: meeting.createdAt || ''
  }));
  return formattedmeetings;
};


//create note service
exports.noteCreateService = async (meetingId, body, userId) => {
  const { notes } = body;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  const updateNote = await Meeting.findByIdAndUpdate(meetingId, {
    notes
  }, { new: true });

  const formattednote = {
    id: updateNote._id,
    notes: updateNote.notes || '',
    businessOwnerId: updateNote.businessOwnerId || '',
    createdByUserId: updateNote.createdByUserId || '',
    createdAt: updateNote.createdAt || ''
  };
  return formattednote;
};

