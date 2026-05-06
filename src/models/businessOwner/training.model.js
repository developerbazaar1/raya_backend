/**
 * TRAINING (ROOT)
 * ----------------
 * Acts as container
 * Does NOT store actual content
 */
const mongoose = require('mongoose');

const { TRAINING_STATUS } = require('../../config/constant');
const trainingSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    title: String,
    description: String,

    sopFileUrl: String,

    // 👇 currently selected version
    activeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingVersion'
    },

    totalVersions: {
      type: Number,
      default: 0,
      max: 3
    },

    status: {
      type: String,
      enum: TRAINING_STATUS,
      default: 'draft'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Training', trainingSchema);
