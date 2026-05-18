const mongoose = require('mongoose');
const Project = require('../../models/businessOwner/project.model');
const AppError = require('../../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');
const Task = require('../../models/businessOwner/task.model');
const TaskAssignment = require('../../models/businessOwner/projectTaskAssignment.model');
const TaskAssignmentHistory = require('../../models/businessOwner/taskAssignmentHistory.model');

exports.getProjectStatsService = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const stats = await Project.aggregate([
    { $match: { assignedUsers: userObjectId } },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        completedProjects: {
          $sum: { $cond: [{ $eq: ['$progress', 100] }, 1, 0] }
        },
        inProgressProjects: {
          $sum: { $cond: [{ $lt: ['$progress', 100] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalProjects: 0,
      completedProjects: 0,
      inProgressProjects: 0
    };
  }

  return {
    totalProjects: stats[0].totalProjects,
    completedProjects: stats[0].completedProjects,
    inProgressProjects: stats[0].inProgressProjects
  };
};

exports.projectService = async (userId, query = {}) => {
  let { page = 1, limit = 10 } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const overallStats = await exports.getProjectStatsService(userId);

  const [projects, total] = await Promise.all([
    Project.aggregate([
      { $match: { assignedUsers: userObjectId } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          __v: 0
        }
      }
    ]),
    Project.countDocuments({ assignedUsers: userObjectId })
  ]);

  return {
    projects,
    stats: overallStats,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

exports.projectDetailService = async (userId, projectId, query = {}) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const { priority } = query;

  const projectDetails = await Project.findOne({
    _id: projectObjectId,
    assignedUsers: userObjectId
  })
    .select('projectName dueDate assignedUsers progress totalTasks completedTasks')
    .populate('assignedUsers', 'name userProfile');

  if (!projectDetails) {
    throw new AppError('Project not found', 404);
  }

  let taskFilter = { projectId: projectObjectId };

  if (priority && priority.trim() !== '') {
    taskFilter.priority = { $regex: new RegExp(`^${priority}$`, 'i') };
  }

  const tasks = await Task.find(taskFilter).sort({ createdAt: -1 });
  const taskIds = tasks.map((task) => task._id);
  const userAssignments = await TaskAssignment.find({
    taskId: { $in: taskIds },
    userId: userObjectId
  }).select('taskId status');

  const assignmentByTask = userAssignments.reduce((map, assignment) => {
    map[assignment.taskId.toString()] = assignment.status;
    return map;
  }, {});

  return {
    id: projectDetails._id,
    projectName: projectDetails.projectName || '',
    startDate: projectDetails.startDate || '',
    dueDate: projectDetails.dueDate || '',
    assignedUsersCount: projectDetails.assignedUsers?.length || 0,
    assignedUsers: (projectDetails.assignedUsers || []).map((user) => ({
      _id: user._id,
      name: user.name || '',
      profileImage: user.userProfile?.url || DEFAULT_PROFILE_IMAGE
    })),
    progress: projectDetails.progress || 0,
    totalTasks: projectDetails.totalTasks || 0,
    completedTasks: projectDetails.completedTasks || 0,
    tasks: tasks.map((task) => ({
      _id: task._id,
      taskName: task.taskName || '',
      description: task.description || '',
      priority: task.priority || '',
      totalAssigned: task.totalAssigned || 0,
      completedCount: task.completedCount || 0,
      myStatus: assignmentByTask[task._id.toString()] || 'not_started'
    }))
  };
};

exports.updateProjectStatusService = async (userId, projectId, body) => {
  const { taskId, status } = body;

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const taskObjectId = new mongoose.Types.ObjectId(taskId);

  const project = await Project.findOne({
    _id: projectObjectId,
    assignedUsers: userObjectId
  });

  if (!project) {
    throw new AppError('Project not found or you are not assigned to it', 404);
  }

  const task = await Task.findOne({ _id: taskObjectId, projectId: projectObjectId });
  if (!task) {
    throw new AppError('Task not found in this project', 404);
  }

  const assignment = await TaskAssignment.findOne({
    taskId: taskObjectId,
    projectId: projectObjectId,
    userId: userObjectId
  });

  if (!assignment) {
    throw new AppError('You are not assigned to this task', 404);
  }

  const updatePayload = { status };

  if (status === 'in_progress') {
    updatePayload.startedAt = assignment.startedAt || new Date();
    updatePayload.completedAt = null;
  } else if (status === 'completed') {
    updatePayload.startedAt = assignment.startedAt || new Date();
    updatePayload.completedAt = new Date();
  } else if (status === 'not_started') {
    updatePayload.startedAt = null;
    updatePayload.completedAt = null;
  }

  const updatedAssignment = await TaskAssignment.findByIdAndUpdate(assignment._id, updatePayload, {
    new: true
  });

  const [assignmentStats] = await TaskAssignment.aggregate([
    { $match: { taskId: taskObjectId } },
    {
      $group: {
        _id: null,
        totalAssigned: { $sum: 1 },
        totalCompleted: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        inProgressCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0]
          }
        },
        notStartedCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0]
          }
        }
      }
    }
  ]);

  const taskStats = {
    totalAssigned: assignmentStats?.totalAssigned || 0,
    totalCompleted: assignmentStats?.totalCompleted || 0,
    inProgressCount: assignmentStats?.inProgressCount || 0,
    notStartedCount: assignmentStats?.notStartedCount || 0
  };

  // Task is completed only when ALL assignees have completed it
  // Task is in_progress if ANY user has started OR some (but not all) have completed
  // Task is not_started only if nobody has touched it
  const taskStatus =
    taskStats.totalAssigned > 0
      ? taskStats.totalCompleted === taskStats.totalAssigned
        ? 'completed'
        : taskStats.inProgressCount > 0 || taskStats.totalCompleted > 0
          ? 'in_progress'
          : 'not_started'
      : 'not_started';

  const updatedTask = await Task.findByIdAndUpdate(
    taskObjectId,
    {
      completedCount: taskStats.totalCompleted,
      status: taskStatus
    },
    { new: true }
  );

  await TaskAssignmentHistory.findOneAndUpdate(
    {
      projectId: projectObjectId,
      taskId: taskObjectId,
      userId: userObjectId
    },
    {
      totalAssignedTask: taskStats.totalAssigned,
      totalCompletedTask: taskStats.totalCompleted,
      totalInProgressTask: taskStats.inProgressCount,
      totalNotStartedTask: taskStats.notStartedCount
    },
    { new: true }
  );

  const totalTasksCount = await Task.countDocuments({ projectId: projectObjectId });
  const completedTasksCount = await Task.countDocuments({
    projectId: projectObjectId,
    status: 'completed' // set when completedCount === totalAssigned
  });
  const progress =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  await Project.findByIdAndUpdate(projectObjectId, {
    completedTasks: completedTasksCount,
    progress
  });

  return {
    task: {
      _id: updatedTask._id,
      taskName: updatedTask.taskName,
      totalAssigned: updatedTask.totalAssigned || 0,
      completedCount: updatedTask.completedCount || 0,
      assignment: {
        _id: updatedAssignment._id,
        status: updatedAssignment.status,
        startedAt: updatedAssignment.startedAt,
        completedAt: updatedAssignment.completedAt
      }
    },
    project: {
      _id: project._id,
      progress,
      completedTasks: completedTasksCount,
      totalTasks: totalTasksCount
    }
  };
};
