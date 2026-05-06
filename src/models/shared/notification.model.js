/**
 * NOTIFICATIONS COLLECTION
 * ------------------------
 * - Stores notifications created for a business owner scope
 * - Supports general and team notification types
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ['general', 'team'],
      default: 'general',
      index: true
    }
  },
  { timestamps: true }
);

// INDEXES
notificationSchema.index({ businessOwnerId: 1, createdAt: -1 });
notificationSchema.index({ createdByUserId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
