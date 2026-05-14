const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../../config/constant');

const todoHistorySchema = new mongoose.Schema(
  {
    todoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum:SCHEDULE_STATUS,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    completedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TodoHistory', todoHistorySchema);
