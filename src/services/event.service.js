const Event = require('../models/businessOwnerTeam/event.model');
const User = require('../models/shared/users.model');
const AppError = require('../utils/appError');

exports.eventCreateService = async (body, userId) => {
    const { eventName, date, startTime, endTime, favorite } = body;

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

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
        eventName: event.eventName || "",
        date: event.date || "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        favorite: event.favorite || "",
        createdByUserId: event.createdByUserId || ""

    }
    return formattedevent;
};

exports.eventGetService = async (userId, query) => {
    const { year, month } = query;
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

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

    const events = await Event.find(filter).select('eventName date startTime endTime favorite createdByUserId createdAt');


    const formattedEvents = events.map(event => ({
        id: event._id,
        eventName: event.eventName || "",
        date: event.date || "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        favorite: event.favorite || "",
        createdByUserId: event.createdByUserId || "",
        createdAt: event.createdAt || ""
    }));
    return formattedEvents;
};