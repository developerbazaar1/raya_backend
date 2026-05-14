const mongoose = require('mongoose');

const userTodoStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    progress: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Middleware to calculate progress before saving
userTodoStatsSchema.pre('save', function (next) {
  if (this.totalTasks > 0) {
    this.progress = Math.round((this.completedTasks / this.totalTasks) * 100);
  } else {
    this.progress = 0;
  }
  next();
});

module.exports = mongoose.model('UserTodoStats', userTodoStatsSchema);
