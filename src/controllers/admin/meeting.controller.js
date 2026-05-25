const { meetingListService } = require('../../services/admin/meeting.service');

exports.meetingList = async (req, res) => {
  const data = await meetingListService(req.params.businessOwnerId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Meeting List fetched successfully',
    data
  });
};
