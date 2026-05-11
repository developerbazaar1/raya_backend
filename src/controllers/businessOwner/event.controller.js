const { eventCreateService, eventGetService } = require('../../services/event.service');


exports.eventCreate = async (req, res) => {
    const data = await eventCreateService(req.body, req.user.userId);
    res.status(201).json({
        status: 'success',
        message: 'Event created successfully.',
        data
    });
}

exports.eventGet = async (req, res) => {
    const data = await eventGetService(req.user.userId, req.query);
    res.status(200).json({
        status: 'success',
        message: 'Events fetched successfully.',
        data
    });
}