/**
 * ONBOARDING STEP (MASTER)
 * ------------------------
 * Defines available onboarding steps
 */
const mongoose = require('mongoose');
const onboardingStepSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },

  title: {
    type: String,
    required: true
  },

  description: String,

  order: {
    type: Number,
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

onboardingStepSchema.index({ order: 1 });

module.exports = mongoose.model('OnboardingStep', onboardingStepSchema);
