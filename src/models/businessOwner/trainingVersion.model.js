const mongoose = require('mongoose');
const { TRAINING_VERSION_STATUS } = require('../../config/constant');
/**
 * TRAINING VERSION
 * ----------------
 * Max 3 per training
 */
const trainingVersionSchema = new mongoose.Schema(
  {
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: '',
      required: true,
      index: true
    },

    versionNumber: {
      type: Number,
      required: true
    },

    title: String,
    description: String,

    passingMarks: {
      type: Number, // %
      default: 70
    },

    status: {
      type: String,
      enum: TRAINING_VERSION_STATUS,
      default: 'draft',
      index: true
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  },
  { timestamps: true }
);

trainingVersionSchema.index({ trainingId: 1, versionNumber: 1 }, { unique: true });

trainingVersionSchema.index({ trainingId: 1, versionNumber: 1 });

module.exports = mongoose.model('TrainingVersion', trainingVersionSchema);
