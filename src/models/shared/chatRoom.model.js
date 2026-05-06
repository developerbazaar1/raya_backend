/**
 * CHAT ROOMS COLLECTION
 * ----------------------
 * - Represents both direct (1-1) and group chats
 * - Stores last message for fast chat list
 */
const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      index: true
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },

    roomName: {
      type: String,
      trim: true
    },

    roomPhotoUrl: String,

    // # HERE Team means single user chat, Group means multi-user chat
    // Beased on the client request
    roomType: {
      type: String,
      enum: ['group', 'team'],
      default: 'group',
      index: true
    },

    //  MESSAGE
    lastMessage: {
      text: String,
      senderId: mongoose.Schema.Types.ObjectId,
      createdAt: Date
    }
  },
  { timestamps: true }
);

//INDEXES
chatRoomSchema.index({ updatedAt: -1 });
chatRoomSchema.index({ businessOwnerId: 1, roomType: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
