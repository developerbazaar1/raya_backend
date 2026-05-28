const mongoose = require('mongoose');
const Project = require('../../models/businessOwner/project.model');
const User = require('../../models/shared/users.model');
const TodoHistory = require('../../models/businessOwnerTeam/todoHistory.model');
const TodoAssignment = require('../../models/businessOwnerTeam/todoAssignment.model');
const AppError = require('../../utils/appError');

/**
 * Validate Mongo Id and Employee
 */
const validateEmployee = async (employeeId) => {
  // Check ObjectId
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError('Invalid Employee ID', 400);
  }

  // Check employee exists
  const employee = await User.findById(employeeId);

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Optional role check
  if (employee.role !== 'employee') {
    throw new AppError('User is not an employee', 400);
  }

  return new mongoose.Types.ObjectId(employeeId);
};

/**
 * Employee Project List
 */
exports.employeeProjectListService = async (employeeId, query) => {
  let { page = 1, limit = 10 } = query;

  const employeeObjectId = await validateEmployee(employeeId);

  // Parse pagination
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  // Pagination validation
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  // Fetch projects
  const [projects, total] = await Promise.all([
    Project.aggregate([
      {
        $match: {
          assignedUsers: employeeObjectId
        }
      },

      {
        $sort: {
          createdAt: -1
        }
      },

      {
        $skip: skip
      },

      {
        $limit: limit
      },

      {
        $lookup: {
          from: 'users',
          localField: 'assignedUsers',
          foreignField: '_id',
          as: 'assignedUsers'
        }
      },

      {
        $project: {
          __v: 0
        }
      }
    ]),

    Project.countDocuments({
      assignedUsers: employeeObjectId
    })
  ]);

  // Format response
  const formattedProjects = projects.map((project) => ({
    id: project._id,
    projectName: project.projectName || '',

    startDate: project.startDate || null,

    dueDate: project.dueDate || null,

    status: project.status || ''
  }));

  return {
    items: formattedProjects,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Employee Todo List
 */
exports.employeeTodoListService = async (employeeId, query) => {
  let { page = 1, limit = 10 } = query;

  // Validate employee ID
  const employeeObjectId = await validateEmployee(employeeId);

  // Parse pagination
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  // Pagination validation
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  // Filters
  const filter = {
    userId: employeeObjectId,

    status: {
      $nin: ['completed', 'overdue']
    }
  };

  // Fetch todo assignments
  const [todoAssignments, total] = await Promise.all([
    TodoAssignment.find(filter)
      .populate('todoId', 'name dueDate repetition')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    TodoAssignment.countDocuments(filter)
  ]);

  const now = new Date();

  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();

  // Format todos
  const formattedTodos = todoAssignments.map((todoAssignment) => {
    const instanceDate = new Date(todoAssignment.instanceDueDate || todoAssignment.todoId?.dueDate);

    const isToday = instanceDate.toDateString() === todayStr;

    return {
      id: todoAssignment._id,

      status: todoAssignment.status || 'not_started',

      name: todoAssignment.todoId?.name || '',

      dueDate: instanceDate,

      repetition: todoAssignment.todoId?.repetition || '',

      isToday,

      createdAt: todoAssignment.createdAt || null
    };
  });

  return {
    items: formattedTodos,

    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Employee Todo History
 */
exports.employeeTodoHistoryService = async (employeeId, query) => {
  let { page = 1, limit = 10 } = query;

  // Validate employee ID
  const employeeObjectId = await validateEmployee(employeeId);

  // Parse pagination
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  // Pagination validation
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  // Filters
  const filter = {
    userId: employeeObjectId
  };

  // Fetch history
  const [history, total] = await Promise.all([
    TodoHistory.find(filter)
      .populate('todoId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    TodoHistory.countDocuments(filter)
  ]);

  // Format history
  const formattedHistory = history.map((item) => ({
    id: item._id,

    todoId: item.todoId?._id || null,

    name: item.todoId?.name || '',

    status: item.status || '',

    dueDate: item.dueDate || null,

    completedAt: item.completedAt || null,

    createdAt: item.createdAt || null
  }));

  return {
    items: formattedHistory,

    pagination: {
      total,
      page,
      limit,

      totalPages: Math.ceil(total / limit)
    }
  };
};
