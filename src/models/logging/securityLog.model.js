const mongoose = require('mongoose');
const { baseLogSchemaOptions, commonLogFields } = require('./baseLogFields');

const SECURITY_LOG_RETENTION_DAYS = 90;

const securityLogSchema = new mongoose.Schema(
  {
    ...commonLogFields,
    principalType: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true,
    },
    principalId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    identifier: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    outcome: {
      type: String,
      enum: ['success', 'failure', 'blocked'],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + SECURITY_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000),
     
    },
  },
  baseLogSchemaOptions,
);

securityLogSchema.index({ principalType: 1, identifier: 1, timestamp: -1 });
securityLogSchema.index({ eventType: 1, outcome: 1, timestamp: -1 });
securityLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
