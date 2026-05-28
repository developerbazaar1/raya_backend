/**
 * KPI Model
 * ----------------
 * - Created by employer
 * - Represents a KPI definition
 */
const mongoose = require('mongoose');

const kpiSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KpiCategory'
    },
    kpiName: { type: String, required: true, trim: true, maxlength: 150 },
    measurementType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MeasurementType',
      required: true
    },
    unit: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kpi', kpiSchema);
