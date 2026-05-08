const Todo = require('../models/businessOwner/todo.model');
const TodoAssignment = require('../models/businessOwnerTeam/todoAssignment.model');
const AppError = require('../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../config/constant')
/**
 * Create a new To-Do item and its assignments
 */
exports.todoCreateService = async (data, businessOwnerId) => {
  const { name, description, dueDate, repetition, assignedUsers } = data;

  const todo = new Todo({
    name,
    description,
    dueDate,
    repetition,
    assignedUsers: assignedUsers,
    businessOwnerId: businessOwnerId
  });

  await todo.save();

  // Create assignments for each user
  if (todo.assignedUsers && todo.assignedUsers.length > 0) {
    const assignments = todo.assignedUsers.map(userId => ({
      todoId: todo._id,
      userId: userId,
      businessOwnerId: businessOwnerId,
      status: 'not_started'
    }));
    await TodoAssignment.insertMany(assignments);
  }

  return formatTask(todo);
};


exports.todoAllService = async (businessOwnerId) => {
  const todos = await Todo.find({ businessOwnerId }).sort({ createdAt: -1 });

  // Fetch all assignments for this business owner and populate user details
  const assignments = await TodoAssignment.find({ businessOwnerId })
    .populate('userId', 'name profileImage');

  // Group assignments by todoId for efficient mapping
  const assignmentsByTodo = assignments.reduce((acc, assignment) => {
    const todoId = assignment.todoId.toString();
    if (!acc[todoId]) acc[todoId] = [];
    acc[todoId].push({
      id: assignment._id,
      user: {
        _id: assignment.userId._id,
        name: assignment.userId.name,
        profileImage: assignment.userId.profileImage || DEFAULT_PROFILE_IMAGE,
      },
      status: assignment.status,
      startedAt: assignment.startedAt,
      completedAt: assignment.completedAt
    });
    return acc;
  }, {});

  return todos.map(todo => {
    const todoAssignments = assignmentsByTodo[todo._id.toString()] || [];

    // Calculate stats
    const totalAssignments = todoAssignments.length;
    const completedAssignments = todoAssignments.filter(a => a.status === 'completed').length;
    const progress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    // Determine due status
    const dueStatus = getDueStatus(todo.dueDate);

    return {
      id: todo._id,
      dueStatus,
      totalAssignments,
      completedAssignments,
      progress,
      assignments: todoAssignments
    };
  });
};

/**
 * Helper to determine due status string
 */
const getDueStatus = (dueDate) => {
  if (!dueDate) return '';
  const now = new Date();
  const due = new Date(dueDate);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueDay - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Due Today';
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 1) return 'Due Tomorrow';
  return `Due in ${diffDays} days`;
};


const formatTask = (todo) => {
  return {
    id: todo._id,
    name: todo.name || '',
    description: todo.description || '',
    dueDate: todo.dueDate || '',
    repetition: todo.repetition || '',
    assignedUsers: todo.assignedUsers || [],
    businessOwnerId: todo.businessOwnerId || '',
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt
  };
};