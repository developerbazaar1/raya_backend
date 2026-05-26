/**
 * KPI History Model
 * ----------------
 * - Created by Antigravity (Solution Architect & Senior Developer)
 * - Represents a historical snapshot of an employee's KPI actual progress vs target goal for a specific period.
 * - Engineered for sub-millisecond aggregation queries under high-volume time-series datasets.
 */
const mongoose = require('mongoose');
const { KPI_RESET_FREQUENCY, KPI_STATUS } = require('../../config/constant');

const kpiHistorySchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KpiCategory',
      required: true
    },
    kpiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kpi',
      required: true
    },
    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeRole',
      default: null
    },
    goalValue: {
      type: Number,
      required: true
    },
    actualValue: {
      type: Number,
      default: 0
    },
    progressPercent: {
      type: Number,
      default: 0
    },
    periodType: {
      type: String,
      enum: KPI_RESET_FREQUENCY, // 'daily', 'weekly', 'monthly', 'yearly'
      required: true
    },
    periodIdentifier: {
      type: String, // format: "YYYY-MM" (monthly), "YYYY-WW" (weekly), "YYYY" (yearly)
      required: true
    },
    periodStartDate: {
      type: Date,
      required: true
    },
    periodEndDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: KPI_STATUS,
      default: 'on_track'
    }
  },
  { timestamps: true }
);

// High-performance compound indexes for history query filters (e.g. types, ranges, searches)
kpiHistorySchema.index({ businessOwnerId: 1, periodType: 1, periodStartDate: -1 });
kpiHistorySchema.index({ kpiId: 1, periodIdentifier: 1 });

// Critical compound unique constraint to ensure transactional integrity of periods
kpiHistorySchema.index(
  { kpiId: 1, assignedUserId: 1, periodIdentifier: 1 },
  { unique: true }
);

module.exports = mongoose.model('kpi_history', kpiHistorySchema);
