const mongoose = require('mongoose');

const kpiResetFrequencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }
    // code: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('KpiResetFrequency', kpiResetFrequencySchema);
