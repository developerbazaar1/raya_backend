const mongoose = require('mongoose');
const Task = require('../models/businessOwner/task.model');
const Project = require('../models/businessOwner/project.model');
const projectTaskAssignment = require('../models/businessOwner/projectTaskAssignment.model');
const TaskAssignmentHistory = require('../models/businessOwner/taskAssignmentHistory.model');
const { uploadFileToSpaces } = require('../helper/fileUpload.helper');
const AppError = require('../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');

const formatTask = (task) => ({
  id: task._id,
  projectId: task.projectId || '',
  taskName: task.taskName || '',
  description: task.description || '',
  dueDate: task.dueDate || '',
  attachments: task.attachments || [],
  businessOwnerId: task.businessOwnerId || '',
  status: task.status || '',
  priority: task.priority || '',
  totalAssigned: task.totalAssigned || 0,
  completedCount: task.completedCount || 0
});

const uploadTaskAttachments = async (files, userId) => {
  if (!files?.length) return [];

  const uploadPromises = files.map((file) =>
    uploadFileToSpaces(file, `business-owners/${userId}/tasks/attachments`)
  );

  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean); // Drop any failed/null uploads
};

const normalizeAssignedUsers = (assignedUsers) => {
  if (!assignedUsers) return [];
  return Array.isArray(assignedUsers) ? assignedUsers : [assignedUsers];
};

const createTaskAssignments = async (projectId, taskId, userIds) => {
  if (!userIds.length) return;

  // Build one assignment record per user
  const assignments = userIds.map((userId) => ({
    projectId,
    taskId,
    userId,
    status: 'not_started'
  }));

  await projectTaskAssignment.insertMany(assignments);

  // Build parallel history records to track progress over time
  const historyRecords = assignments.map(({ userId }) => ({
    projectId,
    taskId,
    userId,
    totalAssignedTask: assignments.length,
    totalCompletedTask: 0,
    totalInProgressTask: 0,
    totalNotStartedTask: assignments.length,
  }));

  await TaskAssignmentHistory.insertMany(historyRecords);
};


const updateProjectStats = async (projectId) => {
  //update project total task count when new task create
  const totalTasks = await Task.countDocuments({ projectId });
  await Project.findByIdAndUpdate(projectId, { totalTasks });
};

exports.taskCreateService = async (payload, files, userId) => {
  const { projectId, taskName, description, dueDate, assignedUsers } = payload;

  // Step 1: Upload attachments to cloud storage
  const attachments = await uploadTaskAttachments(files?.attachments, userId);

  // Step 2: Normalize assigned user IDs
  const userIds = normalizeAssignedUsers(assignedUsers);

  // Step 3: Verify project exists and all assignees are project members
  const project = await Project.findOne({ _id: projectId, businessOwnerId: userId }).select('assignedUsers');
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (userIds.length > 0) {
    const projectMemberIds = project.assignedUsers.map((id) => id.toString());
    const invalidUsers = userIds.filter((id) => !projectMemberIds.includes(id.toString()));
    if (invalidUsers.length > 0) {
      throw new AppError(`These users are not assigned to the project: ${invalidUsers.join(', ')}`, 400);
    }
  }

  // Step 4: Persist the task document
  const task = new Task({
    projectId,
    taskName,
    description,
    dueDate,
    attachments,
    businessOwnerId: userId,
    totalAssigned: userIds.length,
    status: 'not_started'
  });

  await task.save();

  // Step 5: Create assignment + history records for each assigned user
  await createTaskAssignments(projectId, task._id, userIds);

  // Step 6: Recalculate and update the parent project's progress stats
  await updateProjectStats(projectId);

  // Step 7: Return the clean, formatted task response
  return formatTask(task);
};


exports.getTaskByIdService = async (taskId, userId, filters = {}) => {
  const { status } = filters;

  // ── Step 1: Verify task exists and belongs to this business owner ─────────
  const task = await Task.findOne({ _id: taskId, businessOwnerId: userId });
  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  // ── Step 2: Fetch assignments, optionally filtered by status ──────────────
  const assignmentQuery = { taskId };
  if (status) assignmentQuery.status = status;

  const assignments = await projectTaskAssignment
    .find(assignmentQuery)
    .populate('userId', 'name userProfile');

  // ── Step 3: Format each assignee's details ────────────────────────────────
  const assignees = assignments.map((assignment) => ({
    _id: assignment.userId._id,
    name: assignment.userId.name,
    profilePicture: assignment.userId.userProfile?.url || DEFAULT_PROFILE_IMAGE,
    status: assignment.status,
    priority: task.priority,
    startedAt: assignment.startedAt,
    completedAt: assignment.completedAt
  }));

  // Step 4: Aggregate status counts directly from TaskAssignment (real-time, per task)
  const [statusCounts] = await projectTaskAssignment.aggregate([
    { $match: { taskId: task._id } },
    {
      $group: {
        _id: null,
        not_started_task: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } },
        in_progress_task: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed_task: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
      }
    }
  ]);

  const not_started_task = statusCounts?.not_started_task ?? 0;
  const in_progress_task = statusCounts?.in_progress_task ?? 0;
  const completed_task = statusCounts?.completed_task ?? 0;

  // Step 5: Return merged task + assignee data
  return {
    ...formatTask(task),
    not_started_task,
    in_progress_task,
    completed_task,
    assignees
  };
};