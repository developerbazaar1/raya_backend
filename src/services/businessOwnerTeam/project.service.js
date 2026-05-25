const mongoose = require('mongoose');

const Project = require('../../models/businessOwner/project.model');
const Task = require('../../models/businessOwner/task.model');
const TaskAssignment = require('../../models/businessOwner/projectTaskAssignment.model');
const TaskAssignmentHistory = require('../../models/businessOwner/taskAssignmentHistory.model');

const AppError = require('../../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');

/**
 * Validate Mongo ObjectId
 */
const validateObjectId = (id, fieldName = 'Id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }

  return new mongoose.Types.ObjectId(id);
};

/**
 * Get Project Stats
 */
exports.getProjectStatsService = async (userId) => {
  const userObjectId = validateObjectId(userId, 'User ID');

  const stats = await Project.aggregate([
    {
      $match: {
        assignedUsers: userObjectId
      }
    },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },

        completedProjects: {
          $sum: {
            $cond: [{ $eq: ['$progress', 100] }, 1, 0]
          }
        },

        inProgressProjects: {
          $sum: {
            $cond: [{ $lt: ['$progress', 100] }, 1, 0]
          }
        }
      }
    }
  ]);

  return {
    totalProjects: stats[0]?.totalProjects || 0,
    completedProjects: stats[0]?.completedProjects || 0,
    inProgressProjects: stats[0]?.inProgressProjects || 0
  };
};

/**
 * Project List
 */
exports.projectService = async (userId, query = {}) => {
  const userObjectId = validateObjectId(userId, 'User ID');

  let { page = 1, limit = 10 } = query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;

  const overallStats = await exports.getProjectStatsService(userId);

  const [projects, total] = await Promise.all([
    Project.aggregate([
      {
        $match: {
          assignedUsers: userObjectId
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          __v: 0
        }
      }
    ]),

    Project.countDocuments({
      assignedUsers: userObjectId
    })
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

/**
 * Project Details
 */
exports.projectDetailService = async (userId, projectId, query = {}) => {
  const userObjectId = validateObjectId(userId, 'User ID');
  const projectObjectId = validateObjectId(projectId, 'Project ID');

  const { priority } = query;

  const projectDetails = await Project.findOne({
    _id: projectObjectId,
    assignedUsers: userObjectId
  })
    .select('projectName startDate dueDate assignedUsers progress totalTasks completedTasks')
    .populate('assignedUsers', 'name userProfile');

  if (!projectDetails) {
    throw new AppError('Project not found', 404);
  }

  const taskFilter = {
    projectId: projectObjectId
  };

  if (priority?.trim()) {
    taskFilter.priority = {
      $regex: new RegExp(`^${priority}$`, 'i')
    };
  }

  const tasks = await Task.find(taskFilter).sort({ createdAt: -1 });

  const taskIds = tasks.map((task) => task._id);

  const userAssignments = await TaskAssignment.find({
    taskId: { $in: taskIds },
    userId: userObjectId
  }).select('taskId status');

  const assignmentByTask = userAssignments.reduce((acc, assignment) => {
    acc[assignment.taskId.toString()] = assignment.status;
    return acc;
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

/**
 * Update Project Task Status
 */
exports.updateProjectStatusService = async (userId, projectId, body) => {
  const { taskId, status } = body;

  const userObjectId = validateObjectId(userId, 'User ID');
  const projectObjectId = validateObjectId(projectId, 'Project ID');
  const taskObjectId = validateObjectId(taskId, 'Task ID');

  const project = await Project.findOne({
    _id: projectObjectId,
    assignedUsers: userObjectId
  });

  if (!project) {
    throw new AppError('Project not found or you are not assigned to it', 404);
  }

  const task = await Task.findOne({
    _id: taskObjectId,
    projectId: projectObjectId
  });

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

  /**
   * Assignment Update Payload
   */
  const updatePayload = { status };

  if (status === 'in_progress') {
    updatePayload.startedAt = assignment.startedAt || new Date();
    updatePayload.completedAt = null;
  }

  if (status === 'completed') {
    updatePayload.startedAt = assignment.startedAt || new Date();
    updatePayload.completedAt = new Date();
  }

  if (status === 'not_started') {
    updatePayload.startedAt = null;
    updatePayload.completedAt = null;
  }

  const updatedAssignment = await TaskAssignment.findByIdAndUpdate(assignment._id, updatePayload, {
    new: true
  });

  /**
   * Assignment Stats
   */
  const [assignmentStats] = await TaskAssignment.aggregate([
    {
      $match: {
        taskId: taskObjectId
      }
    },
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

  /**
   * Task Status
   */
  let taskStatus = 'not_started';

  if (taskStats.totalAssigned > 0) {
    if (taskStats.totalCompleted === taskStats.totalAssigned) {
      taskStatus = 'completed';
    } else if (taskStats.inProgressCount > 0 || taskStats.totalCompleted > 0) {
      taskStatus = 'in_progress';
    }
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskObjectId,
    {
      completedCount: taskStats.totalCompleted,
      status: taskStatus
    },
    { new: true }
  );

  /**
   * Update Task Assignment History
   */
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
    {
      new: true
    }
  );

  /**
   * Update Project Progress
   */
  const totalTasksCount = await Task.countDocuments({
    projectId: projectObjectId
  });

  const completedTasksCount = await Task.countDocuments({
    projectId: projectObjectId,
    status: 'completed'
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
