const mongoose = require('mongoose');

// # This is project schema to track projects created by business owner and their details
const projectSchema = new mongoose.Schema(
  {
    // Reference to the business owner user
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    projectName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    startDate: Date,
    dueDate: Date,

    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },

    progress: { type: Number, default: 0 }
  },
  { timestamps: true }
);

projectSchema.index({ businessOwnerId: 1 });
projectSchema.index({ assignedUsers: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
