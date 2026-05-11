
const Event = require('../../models/businessOwnerTeam/event.model');
const User = require('../../models/shared/users.model');
const AppError = require('../../utils/appError');

exports.createEventService = async (userId, payload) => {
    const { eventName, date, notes, startTime } = payload;

    const user = await User.findById(userId).select('owner businessId');
    if (!user) {
        throw new AppError('User not found', 404);
    }
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
        eventName: event.eventName || "",
        date: event.date || "",
        startTime: event.startTime || "",
        notes: event.notes || "",
    }

    return formattedEvent;
}


exports.getEventsService = async (userId, query) => {

    const { year, month } = query;
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const businessOwnerId = user.owner;

    const filter = {
        $or: [
            { createdByUserId: userId },
            { createdByUserId: businessOwnerId }
        ]
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

    const events = await Event.find(filter).select('eventName date startTime notes createdByUserId createdAt');


    const formattedEvents = events.map(event => ({
        id: event._id,
        eventName: event.eventName || "",
        date: event.date || "",
        startTime: event.startTime || "",
        notes: event.notes || "",
        createdByUserId: event.createdByUserId || "",
        createdAt: event.createdAt || ""
    }));
    return formattedEvents;
}

