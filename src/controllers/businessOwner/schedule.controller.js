const { getAllSchedule, updateScheduleStatus } = require('../../services/schedule.service');

exports.allSchedules = async (req, res) => {
  const result = await getAllSchedule(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Schedules fetched successfully',
    ...result
  });
};
exports.updateStatus = async (req, res) => {
  const data = await updateScheduleStatus(req.params.scheduleId, req.body);
  res.status(200).json({
    status: 'success',
    message: 'Schedule status updated successfully',
    data
  });
};
