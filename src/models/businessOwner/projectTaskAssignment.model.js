
const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../../config/constant');

// # This is project task assignment schema to track which user is assigned to which task and their status
const taskAssignmentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: SCHEDULE_STATUS,
    default: 'not_started'
  },

  startedAt: Date,
  completedAt: Date

}, { timestamps: true });



// Prevent duplicate assignment
taskAssignmentSchema.index(
  { taskId: 1, userId: 1 },
  { unique: true }
);


// Indexes for efficient querying
taskAssignmentSchema.index({ taskId: 1 });
taskAssignmentSchema.index({ userId: 1, status: 1 });
taskAssignmentSchema.index({ projectId: 1 });
taskAssignmentSchema.index({ taskId: 1, status: 1 });

module.exports = mongoose.model('task_assignment', taskAssignmentSchema);
