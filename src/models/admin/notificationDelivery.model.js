const mongoose = require('mongoose');

const DELIVERY_STATUSES = ['queued', 'sent', 'failed'];

const notificationDeliverySchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationCampaign',
      required: true,
      index: true
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    channel: {
      type: String,
      enum: ['email', 'push'],
      required: true
    },
    status: {
      type: String,
      enum: DELIVERY_STATUSES,
      required: true,
      default: 'queued',
      index: true
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: ''
    },
    providerError: {
      type: String,
      trim: true,
      default: ''
    },
    sentAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

notificationDeliverySchema.index({ campaignId: 1, status: 1 });
notificationDeliverySchema.index({ recipientUserId: 1, createdAt: -1 });

module.exports = mongoose.model(
  'NotificationDelivery',
  notificationDeliverySchema
);
