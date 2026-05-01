const commonLogFields = {
  level: {
    type: String,
    enum: ['debug', 'info', 'warn', 'error', 'critical'],
    required: true,
    index: true,
  },
  service: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  module: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  environment: {
    type: String,
    trim: true,
    lowercase: true,
    default: process.env.NODE_ENV || 'development',
    index: true,
  },
  correlationId: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  requestId: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  actorType: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  actorId: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  targetType: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  targetId: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true,
  },
};

const baseLogSchemaOptions = {
  timestamps: true,
  versionKey: false,
};

module.exports = {
  commonLogFields,
  baseLogSchemaOptions,
};
