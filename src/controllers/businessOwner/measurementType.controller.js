const { measurementTypeGetService } = require('../../services/measurementType.service');

/**
 * Controller to handle the request for fetching measurement types.
 * 
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - req.query: Allows passing query parameters to the service layer.
 * - measurementTypeGetService: The service function responsible for data retrieval.
 */
exports.getMeasurementTypes = async (req, res) => {
  const result = await measurementTypeGetService(req.query);
  res.status(200).json({
    status: 'success',
    message: 'Measurement Types fetched successfully.',
    ...result
  });
};
