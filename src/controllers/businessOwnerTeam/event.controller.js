const {
  createEventService,
  getEventsService,
  eventHistoryService,
  createNoteService
} = require('../../services/businessOwnerTeam/event.service');

//Shows the list of events for the employee
exports.createEvent = async (req, res) => {
  const data = await createEventService(req.user.userId, req.body);
  res.status(201).json({
    status: 'success',
    message: 'Event created successfully.',
    data
  });
};
//Show the list of events for the employee
exports.getEvents = async (req, res) => {
  const data = await getEventsService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Events fetched successfully.',
    data
  });
};
//
exports.eventHistoryGet = async (req, res) => {
  const data = await eventHistoryService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Events fetched successfully.',
    data
  });
};

exports.createNote = async (req, res) => {
  const data = await createNoteService(req.user.userId, req.params.meetingId, req.body);
  res.status(200).json({
    status: 'success',
    message: 'Note created successfully.',
    data
  });
};
