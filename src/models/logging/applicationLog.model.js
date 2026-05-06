/**
 * ApplicationLog Model
 * This model captures logs related to application-level events, such as HTTP requests, errors, and performance metrics. It includes details about the request method, route, status code, duration, and any associated tags. Logs are automatically expired after a defined retention period to manage storage efficiently.
 */
const mongoose = require('mongoose');
const { baseLogSchemaOptions, commonLogFields } = require('./baseLogFields');

const APPLICATION_LOG_RETENTION_DAYS = 7;

const applicationLogSchema = new mongoose.Schema(
  {
    ...commonLogFields,
    httpMethod: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    routePath: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    statusCode: {
      type: Number,
      default: null,
      index: true
    },
    durationMs: {
      type: Number,
      default: null,
      min: 0
    },
    stack: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + APPLICATION_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    }
  },
  baseLogSchemaOptions
);

applicationLogSchema.index({ service: 1, level: 1, timestamp: -1 });
applicationLogSchema.index({ routePath: 1, statusCode: 1, timestamp: -1 });
applicationLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ApplicationLog', applicationLogSchema);
