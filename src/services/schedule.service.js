const mongoose = require('mongoose');
const Schedule = require('../models/businessOwnerTeam/schedule.model');
const AppError = require('../utils/appError');

exports.getAllSchedule = async (userId, query = {}) => {
  let { page = 1, limit = 10 } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const filter = { businessOwnerId: userId };

  const [schedules, total] = await Promise.all([
    Schedule.find(filter)
      .populate('vendorId', 'companyName representativeName')
      .populate('contractorId', 'companyName contractorName')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit),
    Schedule.countDocuments(filter)
  ]);

  const formattedSchedule = schedules.map((schedule) => {
    const type = schedule.vendorId ? 'vendor' : 'contractor';
    const info = schedule.vendorId || schedule.contractorId || {};
    const companyName = info.companyName || info.representativeName || info.contractorName || '';
    const representativeName = info.representativeName || info.contractorName || '';

    return {
      id: schedule._id,
      type,
      representativeName,
      companyName,
      time: schedule.time || '',
      date: schedule.date || '',
      notes: schedule.notes || '',
      status: schedule.status || ''
    };
  });

  return {
    data: formattedSchedule,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

exports.updateScheduleStatus = async (scheduleId, body) => {
  const schedule = await Schedule.findById({ _id: new mongoose.Types.ObjectId(scheduleId) });
  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  schedule.status = body.status;
  await schedule.save();

  return schedule;
};
