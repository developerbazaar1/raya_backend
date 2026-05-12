
const mongoose = require('mongoose');
const Schedule = require('../models/businessOwnerTeam/schedule.model');
const AppError = require('../utils/appError');

exports.getAllSchedule = async (userId) => {

    const schedules = await Schedule.find({ businessOwnerId: userId })
        .populate('vendorId', 'companyName representativeName')
        .populate('contractorId', 'companyName contractorName');


    const formattedSchedule = schedules.map(schedule => {
        const type = schedule.vendorId ? 'vendor' : 'contractor';
        const info = schedule.vendorId || schedule.contractorId || {};
        const companyName = info.companyName || info.representativeName || info.contractorName || "";
        const representativeName = info.representativeName || info.contractorName || "";

        return {
            id: schedule._id,
            type,
            representativeName,
            companyName,
            time: schedule.time || "",
            date: schedule.date || "",
            notes: schedule.notes || "",
            status: schedule.status || ""
        };
    });

    return formattedSchedule;

}

exports.updateScheduleStatus = async (scheduleId, body) => {
    const schedule = await Schedule.findById({ _id: new mongoose.Types.ObjectId(scheduleId) });
    if (!schedule) {
        throw new AppError("Schedule not found", 404);
    }

    schedule.status = body.status;
    await schedule.save();

    return schedule;
};