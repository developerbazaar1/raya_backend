const mongoose = require('mongoose');
const { SCHEDULE_STATUS, TASK_PRIORITY } = require('../../config/constant');

// This is project task schema
const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },

    taskName: {
      type: String,
      required: true,
      trim: true
    },

    description: String,

    priority: {
      type: String,
      enum: TASK_PRIORITY,
      default: 'medium',
      index: true
    },

    dueDate: Date,

    attachments: [String],

    status: {
      type: String,
      enum: SCHEDULE_STATUS,
      default: 'not_started',
      index: true
    },

    totalAssigned: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// INDEXES
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, createdAt: -1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
