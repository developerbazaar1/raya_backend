const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../../config/constant');

const taskAssignmentHistorySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    totalAssignedTask: {
      type: Number,
      default: 0
    },
    totalCompletedTask: {
      type: Number,
      default: 0
    },
    totalInProgressTask: {
      type: Number,
      default: 0
    },
    totalNotStartedTask: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaskAssignmentHistory', taskAssignmentHistorySchema);
