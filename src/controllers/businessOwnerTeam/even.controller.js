const { createEventService, getEventsService } = require('../../services/businessOwnerTeam/event.service');

exports.createEvent = async (req, res) => {
    const data = await createEventService(req.user.userId, req.body);
    res.status(201).json({
        status: 'success',
        message: 'Event created successfully.',
        data
    });
};


exports.getEvents = async (req, res) => {
    const data = await getEventsService(req.user.userId, req.query);
    res.status(200).json({
        status: 'success',
        message: 'Events fetched successfully.',
        data
    });
};