const Project = require('../models/businessOwner/project.model');
// const projectTaskAssignment = require('../models/businessOwner/projectTaskAssignment.model');
const Task = require('../models/businessOwner/task.model');
const AppError = require('../utils/appError');

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

  const formattedProject = formatProject(project);
  await project.save();
  return formattedProject;
};

const formatProject = (project) => {
  return {
    _id: project._id,
    projectName: project.projectName || '',
    description: project.description || '',
    startDate: project.startDate || '',
    dueDate: project.dueDate || '',
    assignedUsers: project.assignedUsers || []
  };
};

exports.projectListService = async (userId, skip = 0, limit = 10) => {
  const projects = await Project.find({
    businessOwnerId: userId
  })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const formattedProjects = projects.map((project) => {
    return {
      _id: project._id,
      projectName: project.projectName || '',
      description: project.description || '',
      startDate: project.startDate || '',
      dueDate: project.dueDate || '',
      totalTasks: project.totalTasks || 0,
      completedTasks: project.completedTasks || 0,
      progress: project.progress || 0
    };
  });
  return formattedProjects;
};

exports.projectDetailsService = async (projectId) => {
  const projectDetails = await Project.findById(projectId).populate('assignedUsers', 'name email');
  if (!projectDetails) {
    throw new AppError('Project not found', 404);
  }

  const tasks = await Task.find({ projectId });

  return {
    _id: projectDetails._id,
    projectName: projectDetails.projectName || '',
    description: projectDetails.description || '',
    startDate: projectDetails.startDate || '',
    dueDate: projectDetails.dueDate || '',
    assignedUsers: projectDetails.assignedUsers || [],
    assignedUsersCount: projectDetails.assignedUsers?.length || 0,
    progress: projectDetails.progress || 0,
    tasks: tasks.map((task) => ({
      _id: task._id,
      taskName: task.taskName || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'not_started'
    }))
  };
};

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
