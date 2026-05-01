/**
 * TODO COLLECTION
 * ----------------
 * - Created by employer
 * - Represents a task definition
 * - NO progress stored here (derived from assignments)
 */
const mongoose = require('mongoose');
const todoSchema = new mongoose.Schema({
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

  description: String,

  dueDate: {
    type: Date,
    index: true
  },

  repetition: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'one-time'],
    default: 'one-time',
    index: true
  }

}, { timestamps: true });

todoSchema.index({ businessOwnerId: 1, createdAt: -1 });

module.exports = mongoose.model('Todo', todoSchema);