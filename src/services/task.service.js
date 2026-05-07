const Task = require('../models/businessOwner/task.model');
const projectTaskAssignment = require('../models/businessOwner/projectTaskAssignment.model');

exports.taskCreateService = async (payload, userId) => {
  const { projectId, taskName, description, dueDate, assignedUsers } = payload;
  const task = new Task({
    projectId,
    taskName,
    description,
    dueDate,
    businessOwnerId: userId
  });

  const formattedTask = formatTask(task);
  await task.save();

  const projectAssignment = new projectTaskAssignment({
    projectId,
    taskId: task._id,
    userId: assignedUsers,
    status: 'not_started',
    startedAt: new Date()
  });
  await projectAssignment.save();
  return formattedTask;
};

const formatTask = (task) => {
  return {
    _id: task._id,
    projectId: task.projectId || '',
    taskName: task.taskName || '',
    description: task.description || '',
    dueDate: task.dueDate || ''
  };
};
