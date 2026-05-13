/**
 * TODO COLLECTION
 * ----------------
 * - Created by employer
 * - Represents a task definition
 * - NO progress stored here (derived from assignments)
 */
const mongoose = require('mongoose');

const { RepetitionTypes } = require('../../config/constant');
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
      enum: RepetitionTypes,
      default: 'one-time',
      index: true
    },

    progress: { type: Number, default: 0 },
    isTopPriority: { type: Boolean, default: false }
  },
  { timestamps: true }
);

todoSchema.index({ businessOwnerId: 1, createdAt: -1 });

module.exports = mongoose.models.Todo || mongoose.model('Todo', todoSchema);
