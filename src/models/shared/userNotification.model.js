/**
 * USER NOTIFICATIONS COLLECTION
 * -----------------------------
 * - Tracks per-user read status for notifications
 * - Prevents duplicate notification assignment to the same user
 */
const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// INDEXES
userNotificationSchema.index({ notificationId: 1, userId: 1 }, { unique: true });
userNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
