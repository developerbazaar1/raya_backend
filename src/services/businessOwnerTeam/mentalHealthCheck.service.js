const MentalHealthCheck = require('../../models/businessOwnerTeam/mentalHealthCheck.model');

exports.MentalHealthCheckService = async (userId, payload) => {
  const { moodScore, note } = payload;

  const mentalHealthCheck = await MentalHealthCheck.create({
    userId,
    moodScore,
    note
  });

  return mentalHealthCheck;
};

exports.getMentalHealthChecks = async (userId) => {
  const checks = await MentalHealthCheck.find({ userId })
    .sort({ createdAt: -1 })
    .select('moodScore moodLabel note isCrisis createdAt');

  return checks.map((item) => ({
    id: item._id,
    moodScore: item.moodScore + '/10' || '',
    moodLabel: item.moodLabel || '',
    note: item.note || '',
    isCrisis: item.isCrisis || false,
    createdAt: item.createdAt
  }));
};
