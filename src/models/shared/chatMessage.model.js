/**
 * CHAT MESSAGES COLLECTION
 * -------------------------
 * - Stores all messages
 * - Lightweight (attachments separated)
 */
const mongoose = require('mongoose');
const chatMessageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true
  },

  senderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  message: {
    type: String,
    trim: true
  },

  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },

  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }

}, { timestamps: true });


// INDEXES
chatMessageSchema.index({ roomId: 1, createdAt: -1 });
chatMessageSchema.index({ senderUserId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
