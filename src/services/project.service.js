const mongoose = require('mongoose');
const Project = require('../models/businessOwner/project.model');
const Task = require('../models/businessOwner/task.model');
const AppError = require('../utils/appError');
const User = require('../models/shared/users.model');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');

//create project service
exports.projectCreateService = async (payload, userId) => {
  const { projectName, description, dueDate, assignedUsers } = payload;
  const project = new Project({
    projectName,
    description,
    startDate: Date.now(),
    dueDate,
    assignedUsers,
    businessOwnerId: userId
  });

  await project.save();

  return {
    _id: project._id,
    projectName: project.projectName || '',
    description: project.description || '',
    startDate: project.startDate || '',
    dueDate: project.dueDate || '',
    assignedUsers: project.assignedUsers || []
  };
};

//show all projects list service
exports.projectListService = async (userId, query = {}) => {
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
      { $match: { businessOwnerId: userObjectId } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          __v: 0
        }
      }
    ]),
    Project.countDocuments({ businessOwnerId: userObjectId })
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


// Get project stats service
exports.getProjectStatsService = async (businessOwnerId) => {
  const stats = await Project.aggregate([
    { $match: { businessOwnerId: new mongoose.Types.ObjectId(businessOwnerId) } },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        // A project is considered pending if progress is exactly 0
        pendingProjects: {
          $sum: {
            $cond: [{ $eq: ['$progress', 0] }, 1, 0]
          }
        },
        // A project is considered active if progress is greater than 0 but less than 100
        activeProjects: {
          $sum: {
            $cond: [{ $and: [{ $gt: ['$progress', 0] }, { $lt: ['$progress', 100] }] }, 1, 0]
          }
        },
        // A project is considered completed if progress is 100 or more
        completedProjects: {
          $sum: {
            $cond: [{ $gte: ['$progress', 100] }, 1, 0]
          }
        }
      }
    }
  ]);

  return {
    totalProjects: stats[0]?.totalProjects || 0,
    activeProjects: stats[0]?.activeProjects || 0,
    completedProjects: stats[0]?.completedProjects || 0,
    pendingProjects: stats[0]?.pendingProjects || 0
  };
};




// Get Project Details Service
exports.projectDetailsService = async (projectId) => {
  // Validate Project ID
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError('Invalid project id', 400);
  }

  // Fetch project and tasks simultaneously
  const [projectDetails, tasks] = await Promise.all([
    Project.findById(projectId)
      .select(
        `
          projectName
          startDate
          dueDate
          progress
          totalTasks
          completedTasks
          assignedUsers
        `
      )
      .populate({
        path: 'assignedUsers',
        select: 'name userProfile'
      })
      .lean(),

    Task.find({ projectId })
      .select(
        `
          taskName
          description
          priority
          dueDate
          attachments
          totalAssigned
          completedCount
        `
      )
      .lean()
  ]);

  // Project not found
  if (!projectDetails) {
    throw new AppError('Project not found', 404);
  }

  // Final response
  return {
    id: projectDetails._id,
    projectName: projectDetails.projectName || "",
    startDate: projectDetails.startDate || "",
    dueDate: projectDetails.dueDate || "",
    progress: projectDetails.progress || 0,
    totalTasks: projectDetails.totalTasks || 0,
    completedTasks: projectDetails.completedTasks || 0,
    assignedUsersCount:
      projectDetails.assignedUsers?.length || 0,
    assignedUsers: (projectDetails.assignedUsers || []).map(
      (user) => ({
        _id: user._id,
        name: user.name,
        profileImage:
          user.userProfile?.url || DEFAULT_PROFILE_IMAGE
      })
    ),
    tasks: tasks.map((task) => ({
      id: task._id,
      taskName: task.taskName || "",
      description: task.description || "",
      priority: task.priority || "",
      dueDate: task.dueDate || "",
      attachments: task.attachments || [],
      totalAssigned: task.totalAssigned || 0,
      completedCount: task.completedCount || 0
    }))
  };
};


//Assigned project to employee service
exports.assignedProjectsService = async (projectId, assignedUsers) => {
  const projectDetails = await Project.findById(projectId);
  if (!projectDetails) {
    throw new AppError('Project not found', 404);
  }

  const currentAssignedUsers = projectDetails.assignedUsers.map((id) => id.toString());
  const newUsers = assignedUsers.filter((id) => !currentAssignedUsers.includes(id.toString()));

  if (newUsers.length === 0) {
    throw new AppError('Project is already assigned to the provided user(s)', 400);
  }

  // Add only new users to the existing list
  projectDetails.assignedUsers.push(...newUsers);

  await projectDetails.save();
  return {
    _id: projectDetails._id,
    projectName: projectDetails.projectName || '',
    assignedUsers: projectDetails.assignedUsers || []
  };
};

//remove project from employee service
exports.removeAssignedUserService = async (projectId, assignedUsers) => {
  const projectDetails = await Project.findById(projectId);
  if (!projectDetails) {
    throw new AppError('Project not found', 404);
  }

  const currentAssignedUsers = projectDetails.assignedUsers.map((id) => id.toString());
  const usersToRemove = assignedUsers.filter((id) => currentAssignedUsers.includes(id.toString()));

  if (usersToRemove.length === 0) {
    throw new AppError('User is not assigned to this project', 400);
  }

  // Remove only users that exist in the current assigned users list
  projectDetails.assignedUsers = projectDetails.assignedUsers.filter(
    (id) => !usersToRemove.includes(id.toString())
  );

  await projectDetails.save();
  return {
    _id: projectDetails._id,
    projectName: projectDetails.projectName || '',
    assignedUsers: projectDetails.assignedUsers || []
  };
};

//Get all employees list service
exports.employeesListService = async (userId, skip = 0, limit = 10) => {
  const employees = await User.find({
    role: 'employee',
    owner: userId
  })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const formattedEmployees = employees.map((employee) => {
    return {
      _id: employee._id,
      name: employee?.name || ''
      // role: employee?.role || 'employee',
      // profileImage: employee?.userProfile?.url || DEFAULT_PROFILE_IMAGE
    };
  });
  return formattedEmployees;
};

