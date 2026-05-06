/**
 * TRAINING ASSIGNMENT
 * -------------------
 * Assigned VERSION (not training)
 */
const mongoose = require('mongoose');
const { TRAINING_ASSIGNMENT_STATUS } = require('../../config/constant');
const trainingAssignmentSchema = new mongoose.Schema({
  trainingVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingVersion',
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  status: {
    type: String,
    enum: TRAINING_ASSIGNMENT_STATUS,
    default: 'not_started'
  },

  progress: {
    type: Number,
    default: 0
  },

  assignedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: Date

}, { timestamps: true });

trainingAssignmentSchema.index(
  { trainingVersionId: 1, userId: 1 },
  { unique: true }
);


module.exports = mongoose.model('TrainingAssignment', trainingAssignmentSchema);
