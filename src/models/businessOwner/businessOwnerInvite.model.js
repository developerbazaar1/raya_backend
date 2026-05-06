/**
 * BUSINESS OWNER INVITES COLLECTION
 * ---------------------------------
 * - Stores invite links sent by users
 * - Tracks lifecycle from pending to accepted or expired
 */
const mongoose = require('mongoose');

const businessOwnerInviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150
    },

    invitedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    inviteToken: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
      index: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    acceptedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// INDEXES
businessOwnerInviteSchema.index({ email: 1, status: 1 });
businessOwnerInviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('BusinessOwnerInvite', businessOwnerInviteSchema);
