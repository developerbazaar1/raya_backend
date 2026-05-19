const mongoose = require('mongoose');

const measurementTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    symbol: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeasurementType', measurementTypeSchema);
