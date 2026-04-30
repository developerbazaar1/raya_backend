const mongoose = require('mongoose');

const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sent', 'failed', 'cancelled'];
const TARGET_USER_TYPES = ['business_owner', 'employee', 'both'];
const CHANNELS = ['email', 'push'];
const CAMPAIGN_TYPES = [
  'notification',
  'announcement',
  'scheduled_downtime',
  'compliance_update',
  'training_alert',
  'urgent_notice',
];

const notificationCampaignSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: CAMPAIGN_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      required: true,
      default: 'draft',
      index: true,
    },
    targetUserType: {
      type: String,
      enum: TARGET_USER_TYPES,
      required: true,
    },
    channels: {
      type: [String],
      enum: CHANNELS,
      default: ['email'],
    },
    targetFilters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    scheduleAt: {
      type: Date,
      default: null,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

notificationCampaignSchema.index({ status: 1, scheduleAt: 1 });
notificationCampaignSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model(
  'NotificationCampaign',
  notificationCampaignSchema,
);
