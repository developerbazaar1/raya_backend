const { kpiResetFrequencyGetService } = require('../../services/kpiResetFrequency.service');

/**
 * Controller to handle the request for fetching KPI reset frequencies.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - req.query: Allows passing query parameters to the service layer.
 * - kpiResetFrequencyGetService: The service function responsible for data retrieval.
 */
exports.getKpiResetFrequencies = async (req, res) => {
  const result = await kpiResetFrequencyGetService(req.query);
  res.status(200).json({
    status: 'success',
    message: 'KPI Reset Frequencies fetched successfully.',
    ...result
  });
};
