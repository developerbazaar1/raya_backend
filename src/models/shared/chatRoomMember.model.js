/**
 * CHAT ROOM MEMBERS COLLECTION
 * -----------------------------
 * - One document per user per room
 * - Handles large groups (1000+ users)
 * - Stores unread count (IMPORTANT)
 */

const mongoose = require('mongoose');

const chatRoomMemberSchema = new mongoose.Schema({
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

  // UNREAD TRACKING
  unreadCount: {
    type: Number,
    default: 0
  },

  joinedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });


// INDEXES
chatRoomMemberSchema.index(
  { roomId: 1, userId: 1 },
  { unique: true }
);

chatRoomMemberSchema.index({ userId: 1 });
chatRoomMemberSchema.index({ userId: 1, unreadCount: 1 });

module.exports = mongoose.model('ChatRoomMember', chatRoomMemberSchema); 