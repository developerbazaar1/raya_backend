const mongoose = require('mongoose');
const Event = require('../../models/businessOwnerTeam/event.model');
const User = require('../../models/shared/users.model');
const Meeting = require('../../models/businessOwner/meeting.model');
const AppError = require('../../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');

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
 * Validate Employee
 */
const validateEmployee = async (userId) => {
  // Validate ObjectId
  const userObjectId = validateObjectId(userId, 'User ID');

  // Check user exists
  const user = await User.findById(userObjectId).select('role owner businessId');

  if (!user) {
    throw new AppError('Employee not found', 404);
  }
  // Validate role
  if (user.role !== 'employee') {
    throw new AppError('User is not an employee', 400);
  }
  return user;
};

/**
 * Create Event Service
 */
exports.createEventService = async (userId, payload) => {
  const { eventName, date, notes, startTime } = payload;
  // Validate employee
  const user = await validateEmployee(userId);

  const businessOwnerId = user.owner;

  // Create event
  const event = await Event.create({
    eventName,
    date,
    startTime,
    notes,
    createdByUserId: user._id,
    businessOwnerId
  });

  return {
    id: event._id,
    businessOwnerId: event.businessOwnerId || '',
    createdByUserId: event.createdByUserId || '',
    eventName: event.eventName || '',
    date: event.date || '',
    startTime: event.startTime || '',
    notes: event.notes || ''
  };
};

/**
 * Get Events Service
 */
exports.getEventsService = async (userId, query) => {
  const { year, month } = query;
  // Validate employee
  const user = await validateEmployee(userId);

  const businessOwnerId = user.owner;

  // Filters
  const filter = {
    $or: [
      {
        createdByUserId: user._id
      },
      {
        createdByUserId: businessOwnerId
      }
    ]
  };

  // Year + Month filter
  if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    filter.date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  // Only year filter
  else if (year) {
    const y = parseInt(year, 10);
    const startDate = new Date(Date.UTC(y, 0, 1));
    const endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));

    filter.date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  // Fetch events
  const events = await Event.find(filter).select(`
      eventName
      date
      startTime
      notes
      createdByUserId
      createdAt
    `);

  // Format response
  return events.map((event) => ({
    id: event._id,
    eventName: event.eventName || '',
    date: event.date || '',
    startTime: event.startTime || '',
    notes: event.notes || '',
    createdByUserId: event.createdByUserId || '',
    createdAt: event.createdAt || ''
  }));
};

/**
 * Event History Service
 */
exports.eventHistoryService = async (userId) => {
  // Validate employee
  const user = await validateEmployee(userId);
  const businessOwnerId = user.owner;
  // Fetch meetings
  const meetings = await Meeting.find({
    $or: [
      {
        createdByUserId: user._id
      },
      {
        createdByUserId: businessOwnerId
      }
    ],

    date: {
      $lt: new Date()
    }
  })
    .sort({ date: -1 })
    .select(
      `
          title
          date
          invitedMembers
          notes
          createdAt
        `
    )
    .populate('invitedMembers', 'name userProfile');

  // Format response
  return meetings.map((meeting) => ({
    id: meeting._id,
    title: meeting.title || '',
    date: meeting.date || '',
    invitedMembers: (meeting.invitedMembers || []).map((member) => ({
      id: member._id,
      name: member.name || '',
      profileImage: member.userProfile?.url || DEFAULT_PROFILE_IMAGE
    })),
    notes: meeting.notes || '',
    createdAt: meeting.createdAt || null
  }));
};

/**
 * Create Note Service
 */
exports.createNoteService = async (userId, meetingId, body) => {
  const { notes } = body;
  // Validate employee
  await validateEmployee(userId);
  // Validate meeting ID
  const meetingObjectId = validateObjectId(meetingId, 'Meeting ID');
  // Check meeting exists
  const meeting = await Meeting.findById(meetingObjectId);
  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }
  // Update note
  const updatedNote = await Meeting.findByIdAndUpdate(
    meetingObjectId,
    {
      notes
    },
    {
      new: true
    }
  );
  return {
    id: updatedNote._id,
    notes: updatedNote.notes || '',
    businessOwnerId: updatedNote.businessOwnerId || '',
    createdByUserId: updatedNote.createdByUserId || '',
    createdAt: updatedNote.createdAt || null
  };
};
