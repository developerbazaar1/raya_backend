const { createMeetingService, allMeetingService } = require('../../services/meeting.service');

exports.meetingCreate = async (req, res) => {
  const data = await createMeetingService(req.body, req.user.userId);
  return res.status(200).json({
    status: 'success',
    message: 'Meeting created successfully',
    data
  });
};

exports.meetingAll = async (req, res) => {
  const data = await allMeetingService(req.user.userId, req.query);
  return res.status(200).json({
    status: 'success',
    message: 'Meetings fetched successfully',
    data
  });
};
