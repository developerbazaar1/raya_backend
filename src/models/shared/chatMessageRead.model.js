/**
 * CHAT MESSAGE READ RECEIPTS COLLECTION
 * -------------------------------------
 * - One document per message per user
 * - Required for group chats where each member can have a different read state
 */
const mongoose = require('mongoose');

const chatMessageReadSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
      required: true
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    readStatus: {
      type: String,
      enum: ['sent', 'received', 'read'],
      default: 'received'
    },

    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

chatMessageReadSchema.index({ messageId: 1, userId: 1 }, { unique: true });
chatMessageReadSchema.index({ roomId: 1, userId: 1, readStatus: 1 });

module.exports = mongoose.model('ChatMessageRead', chatMessageReadSchema);
