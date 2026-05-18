const Todo = require('../models/businessOwner/todo.model');
const TodoAssignment = require('../models/businessOwnerTeam/todoAssignment.model');
const EmployeeInfo = require('../models/businessOwnerTeam/employeesInfo.model');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant');

//Create a new To-Do item and its initial assignments

exports.todoCreateService = async (data, businessOwnerId) => {
  const { name, description, dueDate, repetition, assignedUsers } = data;

  // 1. Create and save the Todo definition (Template)
  const todo = new Todo({
    name,
    description,
    dueDate,
    repetition,
    assignedUsers,
    businessOwnerId
  });
  await todo.save();

  // 2. Handle initial assignments if users are specified
  if (todo.assignedUsers && todo.assignedUsers.length > 0) {
    const instanceDueDate = calculateInitialInstanceDueDate(repetition, todo.dueDate);
    await createTodoAssignments(todo, instanceDueDate, businessOwnerId);
  }

  return {
    id: todo._id,
    name: todo.name,
    description: todo.description,
    dueDate: todo.dueDate,
    repetition: todo.repetition
  };
};

//Helper: Creates assignment records and syncs user statistics
const createTodoAssignments = async (todo, instanceDueDate, businessOwnerId) => {
  const assignments = todo.assignedUsers.map((userId) => ({
    todoId: todo._id,
    userId,
    businessOwnerId,
    status: 'not_started',
    instanceDueDate
  }));

  await TodoAssignment.insertMany(assignments);
};

const calculateInitialInstanceDueDate = (repetition, finalDueDate) => {
  const now = new Date();

  // Ensure the final deadline is at the very END of the day (23:59:59)
  // Otherwise, a date like "2026-05-14" defaults to midnight (00:00) and immediately expires!
  const endOfFinalDate = new Date(finalDueDate);
  endOfFinalDate.setHours(23, 59, 59, 999);

  let instanceDate = new Date(endOfFinalDate);

  if (repetition === 'daily') {
    instanceDate = new Date(now);
    instanceDate.setHours(23, 59, 59, 999);
  } else if (repetition === 'weekly') {
    instanceDate = new Date(now);
    const day = instanceDate.getDay();
    const diff = instanceDate.getDate() + (day === 0 ? 0 : 7 - day);
    instanceDate.setDate(diff);

    instanceDate.setHours(23, 59, 59, 999);
  }

  // Ensure instance deadline never goes beyond the final task deadline
  return instanceDate > endOfFinalDate ? new Date(endOfFinalDate) : instanceDate;
};

exports.todoAllService = async (businessOwnerId) => {
  // 1. Calculate Start and End of Today
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 2. Fetch only assignments due TODAY and NOT COMPLETED
  const assignments = await TodoAssignment.find({
    businessOwnerId,
    instanceDueDate: { $gte: startOfToday, $lte: endOfToday },
    status: { $ne: 'completed' }
  });

  if (assignments.length === 0) return { teamStats: [] };

  // 2. Calculate task stats per user
  const userStats = assignments.reduce((acc, curr) => {
    const uId = curr.userId.toString();
    if (!acc[uId]) acc[uId] = { total: 0, completed: 0 };
    acc[uId].total++;
    if (curr.status === 'completed') acc[uId].completed++;
    return acc;
  }, {});

  const assignedUserIds = Object.keys(userStats);

  // 3. Fetch Employee details (including Roles) for these specific users
  const employees = await EmployeeInfo.find({
    businessOwnerId,
    userId: { $in: assignedUserIds }
  })
    .populate('userId', 'name profileImage')
    .populate('employeeRoleId', 'roleName');

  // 4. Group by Role
  const roleGroups = employees.reduce((acc, emp) => {
    const roleId = emp.employeeRoleId?._id?.toString() || 'unassigned';
    const roleName = emp.employeeRoleId?.roleName || 'Unassigned';

    if (!acc[roleId]) {
      acc[roleId] = { roleId, roleName, users: [] };
    }

    const stats = userStats[emp.userId._id.toString()] || { total: 0, completed: 0 };

    acc[roleId].users.push({
      userId: emp.userId._id,
      userName: emp.userId.name || '',
      profileImage: emp.userId.profileImage || DEFAULT_PROFILE_IMAGE,
      totalTaskAssign: stats.total,
      completedTask: stats.completed,
      progress: 0 // Set to 0 as requested
    });

    return acc;
  }, {});

  return { teamStats: Object.values(roleGroups) };
};

exports.ceoToDoListService = async (userId) => {
  // Fetch all todos where userId is in assignedUsers
  const todos = await Todo.find({
    assignedUsers: userId
  }).sort({ createdAt: -1 });

  if (!todos.length) {
    return { todos: [] };
  }

  // Get TodoAssignment records for these todos
  const todoIds = todos.map((todo) => todo._id);
  const assignments = await TodoAssignment.find({
    todoId: { $in: todoIds },
    userId: userId
  });

  // Create assignment status map
  const assignmentStatusMap = assignments.reduce((map, assignment) => {
    map[assignment.todoId.toString()] = {
      status: assignment.status,
      instanceDueDate: assignment.instanceDueDate,
      startedAt: assignment.startedAt,
      completedAt: assignment.completedAt
    };
    return map;
  }, {});

  // Format todos with assignment details
  const formattedTodos = todos.map((todo) => ({
    id: todo._id,
    name: todo.name,
    description: todo.description,
    dueDate: todo.dueDate,
    repetition: todo.repetition,
    assignedUsers: todo.assignedUsers || [],
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
    assignment: assignmentStatusMap[todo._id.toString()] || {
      status: 'not_started',
      instanceDueDate: null,
      startedAt: null,
      completedAt: null
    }
  }));

  return { todos: formattedTodos };
};


exports.todoHistoryService = async (businessOwnerId, query = {}) => {
  const { page = 1, limit = 10, status } = query;
  const pageNo = Math.max(1, parseInt(page, 10));
  const limitNo = Math.max(1, parseInt(limit, 10));
  const skip = (pageNo - 1) * limitNo;

  const filter = {
    businessOwnerId,
    status: { $in: ['completed', 'overdue'] }
  };

  if (status && ['not_started', 'in_progress', 'completed', 'overdue'].includes(status)) {
    filter.status = status;
  }

  const [historyItems, total] = await Promise.all([
    TodoAssignment.find(filter)
      .populate('todoId', 'name dueDate repetition')
      .populate('userId', 'name profileImage')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNo),
    TodoAssignment.countDocuments(filter)
  ]);

  const items = historyItems.map((item) => ({
    id: item._id,
    todoId: item.todoId?._id,
    todoName: item.todoId?.name || '',
    userId: item.userId?._id,
    userName: item.userId?.name || '',
    userProfileImage: item.userId?.profileImage || '',
    status: item.status,
    dueDate: item.instanceDueDate || item.todoId?.dueDate,
    startedAt: item.startedAt,
    completedAt: item.completedAt,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt
  }));

  return {
    items,
    pagination: {
      total,
      page: pageNo,
      limit: limitNo,
      totalPages: Math.ceil(total / limitNo)
    }
  };
}

// const getDueStatus = (dueDate) => {
//   if (!dueDate) return '';
//   const now = new Date();
//   const due = new Date(dueDate);

//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

//   const diffTime = dueDay - today;
//   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//   if (diffDays === 0) return 'Due Today';
//   if (diffDays < 0) return 'Overdue';
//   if (diffDays === 1) return 'Due Tomorrow';
//   return `Due in ${diffDays} days`;
// };
