const mongoose = require('mongoose');
const { TRAINING_GENERATION_STATUS } = require('../../config/constant');

const trainingGenerationJobSchema = new mongoose.Schema(
  {
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
      index: true
    },

    trainingVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingVersion',
      required: true,
      index: true
    },

    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    bullJobId: String,

    generateQuiz: {
      type: Boolean,
      default: false
    },

    quizCount: {
      type: Number,
      default: 10
    },

    status: {
      type: String,
      enum: TRAINING_GENERATION_STATUS,
      default: 'queued',
      index: true
    },

    attemptsMade: {
      type: Number,
      default: 0
    },

    error: String,
    completedAt: Date
  },
  { timestamps: true }
);

trainingGenerationJobSchema.index({ trainingId: 1, trainingVersionId: 1 });

module.exports = mongoose.model('TrainingGenerationJob', trainingGenerationJobSchema);
