/**
 * TODO COLLECTION
 * ----------------
 * - Created by employer
 * - Represents a task definition
 * - NO progress stored here (derived from assignments)
 */
const mongoose = require('mongoose');

const { REPETITION_TYPES } = require('../../config/constant');
const todoSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    description: String,
    dueDate: {
      type: Date,
      index: true
    },
    repetition: {
      type: String,
      enum: REPETITION_TYPES,
      default: 'one-time',
      index: true
    },
    // totalTodos: { type: Number, default: 0 },
    // completedTodos: { type: Number, default: 0 },
    // progress: { type: Number, default: 0 },

    isTopPriority: { type: Boolean, default: false },
    priorityOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

todoSchema.index({ businessOwnerId: 1, createdAt: -1 });

module.exports = mongoose.models.Todo || mongoose.model('Todo', todoSchema);
