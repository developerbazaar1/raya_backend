const MeasurementType = require('../models/shared/measurementType.model');

/**
 * Service to fetch all available measurement types (global reference data).
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - query (Object, optional): Not heavily utilized right now, but passed for future scalability (e.g., pagination).
 * - MeasurementType (Model): The shared MongoDB collection containing global names and symbols.
 */
exports.measurementTypeGetService = async (query = {}) => {
  const types = await MeasurementType.find().select('name symbol').sort({ name: 1 });

  const formattedTypes = types.map((type) => ({
    id: type._id,
    name: type.name || '',
    symbol: type.symbol || ''
  }));

  return { data: formattedTypes };
};
