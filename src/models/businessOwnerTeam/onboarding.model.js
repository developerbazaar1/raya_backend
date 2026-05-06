/**
 * USER ONBOARDING
 * ----------------
 * Tracks onboarding progress per user
 */
const mongoose = require('mongoose');
const userOnboardingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      unique: true,
      index: true
    },

    steps: [
      {
        key: {
          type: String,
          required: true
        },

        status: {
          type: String,
          enum: ['pending', 'completed'],
          default: 'pending'
        },

        completedAt: Date
      }
    ],

    progress: {
      type: Number,
      default: 0
    },

    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserOnboarding', userOnboardingSchema);
