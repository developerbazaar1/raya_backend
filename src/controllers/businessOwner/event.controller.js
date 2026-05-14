const {
  eventCreateService,
  eventGetService,
  eventHistoryGetService,
  noteCreateService,
  eventDeleteService
} = require('../../services/event.service');
exports.eventCreate = async (req, res) => {
  const data = await eventCreateService(req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'Event created successfully.',
    data
  });
};
exports.eventGet = async (req, res) => {
  const result = await eventGetService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Events fetched successfully.',
    ...result
  });
};
exports.eventHistoryGet = async (req, res) => {
  const data = await eventHistoryGetService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Meet history fetched successfully.',
    data
  });
};
exports.createNote = async (req, res) => {
  const data = await noteCreateService(req.params.meetingId, req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'Note created successfully.',
    data
  });
};
exports.eventDelete = async (req, res) => {
  const data = await eventDeleteService(req.params.eventId, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'Event deleted successfully.',
    data
  });
};
