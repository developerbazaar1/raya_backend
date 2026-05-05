const mongoose = require('mongoose');
const { baseLogSchemaOptions, commonLogFields } = require('./baseLogFields');

const JOB_LOG_RETENTION_DAYS = 30;

const jobLogSchema = new mongoose.Schema(
  {
    ...commonLogFields,
    jobName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    runId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    queueName: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['started', 'succeeded', 'failed', 'retried', 'cancelled'],
      required: true,
      index: true,
    },
    attempt: {
      type: Number,
      default: 1,
      min: 1,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + JOB_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000),
    },
  },
  baseLogSchemaOptions,
);

jobLogSchema.index({ jobName: 1, status: 1, timestamp: -1 });
jobLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('JobLog', jobLogSchema);
