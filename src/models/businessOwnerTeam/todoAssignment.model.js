/**
 * TODO ASSIGNMENT COLLECTION
 * --------------------------
 * - Each document = ONE user + ONE todo
 * - THIS is where progress lives
 */
const mongoose = require('mongoose');
const todoAssignmentSchema = new mongoose.Schema({
  todoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Todo',
    required: true
  },

  // Reference to the user assigned to this todo
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Reference to the business owner user
  businessOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ['notStarted', 'inProgress', 'completed'],
    default: 'notStarted',
    index: true
  },

  startedAt: Date,
  completedAt: Date

}, { timestamps: true });


// 🔥 INDEXES
todoAssignmentSchema.index(
  { todoId: 1, userId: 1 },
  { unique: true }
);

todoAssignmentSchema.index({ userId: 1, status: 1 });
todoAssignmentSchema.index({ todoId: 1, status: 1 });
todoAssignmentSchema.index({ businessOwnerId: 1 });

module.exports = mongoose.model('TodoAssignment', todoAssignmentSchema);
