const mongoose = require('mongoose');
const { baseLogSchemaOptions, commonLogFields } = require('./baseLogFields');

const INTEGRATION_LOG_RETENTION_DAYS = 30;

const integrationLogSchema = new mongoose.Schema(
  {
    ...commonLogFields,
    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    operation: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'outbound',
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'retry', 'timeout'],
      required: true,
      index: true,
    },
    externalRequestId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    responseCode: {
      type: Number,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
      min: 0,
    },
    errorCode: {
      type: String,
      trim: true,
      default: '',
    },
    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + INTEGRATION_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000),
    },
  },
  baseLogSchemaOptions,
);

integrationLogSchema.index({ provider: 1, operation: 1, timestamp: -1 });
integrationLogSchema.index({ status: 1, timestamp: -1 });
integrationLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('IntegrationLog', integrationLogSchema);
