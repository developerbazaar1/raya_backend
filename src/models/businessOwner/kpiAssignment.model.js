/**
 * KPI Assignment Model
 * ----------------
 * - Created by employer
 * - Represents the assignment of a KPI to an employee, including goal value, progress, and status
 */
const mongoose = require('mongoose');
const { KPI_RESET_FREQUENCY, KPI_STATUS } = require('../../config/constant');

const kpiAssignmentSchema = new mongoose.Schema({
  businessOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KpiCategory'
  },
  kpiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kpi'
  },

  goalValue: { type: Number, required: true },
  resetFrequency: {
    type: String,
    enum: KPI_RESET_FREQUENCY
  },
  isRepeat: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeRole',
    default: null
  },
  status: {
    type: String,
    enum: KPI_STATUS
  },
  assignedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });


module.exports = mongoose.model('kpi_assignment', kpiAssignmentSchema);
