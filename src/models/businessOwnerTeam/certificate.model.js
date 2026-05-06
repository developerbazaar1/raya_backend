/**
 * CERTIFICATE
 */
const mongoose = require('mongoose');
const certificateSchema = new mongoose.Schema(
  {
    trainingVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingVersion'
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    score: Number,
    passingMarks: Number,

    certificateUrl: String,

    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

certificateSchema.index({ trainingVersionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
