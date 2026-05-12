const { getAllSchedule, updateScheduleStatus } = require('../../services/schedule.service');

exports.allSchedules = async (req, res) => {
    const data = await getAllSchedule(req.user.userId);

    res.status(200).json({
        status: "success",
        message: "Schedules fetched successfully",
        data
    });
};

exports.updateStatus = async (req, res) => {
    const data = await updateScheduleStatus(req.params.scheduleId, req.body);

    res.status(200).json({
        status: "success",
        message: "Schedule status updated successfully",
        data
    });
};
