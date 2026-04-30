const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  businessOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
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
      ref: 'user'
    }
  ],

  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },

  progress: { type: Number, default: 0 } 

}, { timestamps: true });

projectSchema.index({ businessOwnerId: 1 });
projectSchema.index({ assignedUsers: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('project', projectSchema);