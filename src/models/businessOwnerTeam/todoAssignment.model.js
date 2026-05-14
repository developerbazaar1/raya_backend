/**
 * TODO ASSIGNMENT COLLECTION
 * --------------------------
 * - Each document = ONE user + ONE todo
 * - THIS is where progress lives
 */
const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../../config/constant');
const todoAssignmentSchema = new mongoose.Schema(
  {
    todoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    status: {
      type: String,
      enum: SCHEDULE_STATUS,
      default: 'not_started',
      index: true
    },

    startedAt: Date,
    completedAt: Date,
    instanceDueDate: {
      type: Date,
      index: true
    }
  },
  { timestamps: true }
);

// 🔥 INDEXES
todoAssignmentSchema.index({ todoId: 1, userId: 1 }, { unique: true });

todoAssignmentSchema.index({ userId: 1, status: 1 });
todoAssignmentSchema.index({ todoId: 1, status: 1 });
todoAssignmentSchema.index({ businessOwnerId: 1 });

module.exports = mongoose.model('TodoAssignment', todoAssignmentSchema);
