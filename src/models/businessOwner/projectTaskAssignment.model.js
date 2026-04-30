const taskAssignmentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'task',
    required: true
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'project',
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },

  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
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