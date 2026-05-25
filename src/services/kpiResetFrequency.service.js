const KpiResetFrequency = require('../models/shared/kpiResetFrequency.model');

/**
 * Service to fetch all available KPI reset frequencies (global reference data).
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - query (Object, optional): Passed for future scalability (e.g., pagination or filtering).
 * - KpiResetFrequency (Model): The shared MongoDB collection containing global names and codes.
 */
exports.kpiResetFrequencyGetService = async (query = {}) => {
  const frequencies = await KpiResetFrequency.find().select('name code').sort({ name: 1 });

  const formattedFrequencies = frequencies.map((freq) => ({
    id: freq._id,
    name: freq.name || ''
  }));

  return { data: formattedFrequencies };
};
