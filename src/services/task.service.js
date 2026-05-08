const Task = require('../models/businessOwner/task.model');
const projectTaskAssignment = require('../models/businessOwner/projectTaskAssignment.model');
const { updateProjectStats } = require('./project.service');
const { uploadFileToSpaces } = require('../helper/fileUpload.helper');
const AppError = require('../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');

exports.taskCreateService = async (payload, files, userId) => {
  const { projectId, taskName, description, dueDate, assignedUsers } = payload;
  const attachmentFiles = files?.attachments || [];

  const attachments = attachmentFiles.length
    ? await Promise.all(
      attachmentFiles.map(async (file) => {
        const metadata = await uploadFileToSpaces(
          file,
          `business-owners/${userId}/tasks/attachments`
        );
        return metadata;
      })
    )
    : [];

  // Handle multiple assigned users
  const userIds = Array.isArray(assignedUsers) ? assignedUsers : [assignedUsers].filter(Boolean);

  const task = new Task({
    projectId,
    taskName,
    description,
    dueDate,
    attachments: attachments.filter(Boolean),
    businessOwnerId: userId,
    totalAssigned: userIds.length
  });

  const formattedTask = formatTask(task);
  await task.save();

  // Create assignments for each user

  if (userIds.length > 0) {
    const assignments = userIds.map((uId) => ({
      projectId,
      taskId: task._id,
      userId: uId,
      status: 'not_started'
    }));
    await projectTaskAssignment.insertMany(assignments);
  }

  // Update project stats (totalTasks, completedTasks, progress)
  await updateProjectStats(projectId);

  return formattedTask;
};

const formatTask = (task) => {
  return {
    _id: task._id,
    projectId: task.projectId || '',
    taskName: task.taskName || '',
    description: task.description || '',
    dueDate: task.dueDate || '',
    attachments: task.attachments || [],
    businessOwnerId: task.businessOwnerId || '',
    status: task.status || '',
    priority: task.priority,
    totalAssigned: task.totalAssigned || 0,
    completedCount: task.completedCount || 0
  };
};

exports.getTaskByIdService = async (taskId, userId, filters = {}) => {
  const { status } = filters;
  const task = await Task.findOne({ _id: taskId, businessOwnerId: userId });

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  const assignmentQuery = { taskId };
  if (status) {
    assignmentQuery.status = status;
  }

  const assignments = await projectTaskAssignment
    .find(assignmentQuery)
    .populate('userId', 'name userProfile');

  const assignees = assignments.map((assignment) => ({
    _id: assignment.userId._id,
    name: assignment.userId.name,
    profilePicture: assignment.userId.profileImage || DEFAULT_PROFILE_IMAGE,
    status: assignment.status,
    priority: task.priority,
    startedAt: assignment.startedAt,
    completedAt: assignment.completedAt
  }));



  // Count assignees by status
  const not_started_task = assignments.filter((a) => a.status === 'not_started').length;
  const in_progress_task = assignments.filter((a) => a.status === 'in_progress').length;
  const completed_task = assignments.filter((a) => a.status === 'completed').length;

  return {
    ...formatTask(task),
    not_started_task,
    in_progress_task,
    completed_task,
    assignees
  };
};
