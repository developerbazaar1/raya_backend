const Event = require('../../models/businessOwnerTeam/event.model');
const User = require('../../models/shared/users.model');
const Meeting = require('../../models/businessowner/meeting.model');
const AppError = require('../../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');

//create Event Service
exports.createEventService = async (userId, payload) => {
    const { eventName, date, notes, startTime } = payload;

    const user = await User.findById(userId).select('owner businessId');
    const businessOwnerId = user.owner;

    const event = new Event({
        eventName,
        date,
        startTime,
        notes,
        createdByUserId: userId,
        businessOwnerId: businessOwnerId
    });
    await event.save();

    const formattedEvent = {
        id: event._id,
        businessOwnerId: event.businessOwnerId,
        createdByUserId: event.createdByUserId,
        eventName: event.eventName || '',
        date: event.date || '',
        startTime: event.startTime || '',
        notes: event.notes || ''
    };

    return formattedEvent;
};

//get Events Service
exports.getEventsService = async (userId, query) => {
    const { year, month } = query;
    const user = await User.findById(userId);

    const businessOwnerId = user.owner;

    const filter = {
        $or: [{ createdByUserId: userId }, { createdByUserId: businessOwnerId }]
    };

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
        'eventName date startTime notes createdByUserId createdAt'
    );

    const formattedEvents = events.map((event) => ({
        id: event._id,
        eventName: event.eventName || '',
        date: event.date || '',
        startTime: event.startTime || '',
        notes: event.notes || '',
        createdByUserId: event.createdByUserId || '',
        createdAt: event.createdAt || ''
    }));
    return formattedEvents;
};

//Get All Meet History Service
exports.eventHistoryService = async (userId) => {
    const user = await User.findById(userId);

    const businessOwnerId = user.owner;

    const meetings = await Meeting.find({
        $or: [{ createdByUserId: userId }, { createdByUserId: businessOwnerId }],
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
exports.createNoteService = async (userId, meetingId, body) => {
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
