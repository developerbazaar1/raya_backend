const mongoose = require('mongoose');

const TodoAssignment = require('../../models/businessOwnerTeam/todoAssignment.model');
const TodoHistory = require('../../models/businessOwnerTeam/todoHistory.model');

const AppError = require('../../utils/appError');

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
 * Get All Todos
 */
exports.getAllTodo = async (userId, query = {}) => {
  const userObjectId = validateObjectId(userId, 'User ID');

  let { page = 1, limit = 10 } = query;

  page = Math.max(1, parseInt(page, 10));
  limit = Math.max(1, parseInt(limit, 10));

  const skip = (page - 1) * limit;

  const filter = {
    userId: userObjectId,
    status: {
      $nin: ['completed', 'overdue']
    }
  };

  const [todoAssignments, total] = await Promise.all([
    TodoAssignment.find(filter)
      .populate('todoId', 'name dueDate repetition')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    TodoAssignment.countDocuments(filter)
  ]);

  const today = new Date();
  const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();

  const items = todoAssignments.map((todoAssignment) => {
    const instanceDate = new Date(todoAssignment.instanceDueDate || todoAssignment.todoId?.dueDate);

    return {
      id: todoAssignment._id,
      status: todoAssignment.status || 'not_started',
      name: todoAssignment.todoId?.name || '',
      dueDate: instanceDate,

      repetition: todoAssignment.todoId?.repetition || '',

      isToday: instanceDate.toDateString() === todayStr,

      createdAt: todoAssignment.createdAt || ''
    };
  });

  return {
    items,

    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update Todo Status
 */
exports.updateStatus = async (todoAssignmentId, body, userId) => {
  const { status } = body;

  const todoAssignmentObjectId = validateObjectId(todoAssignmentId, 'Todo Assignment ID');

  const userObjectId = validateObjectId(userId, 'User ID');

  const todoAssignment = await TodoAssignment.findById(todoAssignmentObjectId).populate('todoId');

  if (!todoAssignment) {
    throw new AppError('Todo assignment not found', 404);
  }

  if (todoAssignment.userId.toString() !== userObjectId.toString()) {
    throw new AppError('You are not authorized to update this todo assignment', 403);
  }

  const now = new Date();

  /**
   * Update timestamps
   */
  if (status === 'in_progress' && !todoAssignment.startedAt) {
    todoAssignment.startedAt = now;
  }

  if (status === 'completed' && !todoAssignment.completedAt) {
    todoAssignment.completedAt = now;
  }

  todoAssignment.status = status;

  await todoAssignment.save();

  /**
   * Store History
   */
  if (status === 'completed') {
    await TodoHistory.create({
      todoId: todoAssignment.todoId._id,
      userId: todoAssignment.userId,
      status: 'completed',
      dueDate: todoAssignment.instanceDueDate || todoAssignment.todoId?.dueDate,
      completedAt: now
    });
  }

  const isOverdue = todoAssignment.todoId?.dueDate && new Date(todoAssignment.todoId.dueDate) < now;

  return {
    ...todoAssignment.toObject(),

    isOverdue: Boolean(isOverdue && status !== 'completed'),

    todoId: {
      _id: todoAssignment.todoId?._id,
      name: todoAssignment.todoId?.name || '',
      dueDate: todoAssignment.todoId?.dueDate || null
    }
  };
};

/**
 * Get Todo History
 */
exports.getTodoHistory = async (userId, query = {}) => {
  const userObjectId = validateObjectId(userId, 'User ID');

  let { page = 1, limit = 10 } = query;

  page = Math.max(1, parseInt(page, 10));
  limit = Math.max(1, parseInt(limit, 10));

  const skip = (page - 1) * limit;

  const filter = {
    userId: userObjectId
  };

  const [history, total] = await Promise.all([
    TodoHistory.find(filter)
      .populate('todoId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    TodoHistory.countDocuments(filter)
  ]);

  const items = history.map((item) => ({
    id: item._id,
    todoId: item.todoId?._id,
    name: item.todoId?.name || '',
    status: item.status || '',
    dueDate: item.dueDate || '',
    completedAt: item.completedAt || '',
    createdAt: item.createdAt || ''
  }));

  return {
    items,

    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Process Todo Resets
 * Cron Job Logic
 */
exports.processTodoResets = async () => {
  const now = new Date();

  const assignments = await TodoAssignment.find({
    instanceDueDate: { $lt: now },

    status: {
      $in: ['not_started', 'in_progress']
    }
  }).populate('todoId');

  for (const assignment of assignments) {
    /**
     * Save Overdue History
     */
    if (assignment.status !== 'completed') {
      await TodoHistory.create({
        todoId: assignment.todoId._id,
        userId: assignment.userId,

        status: 'overdue',

        dueDate: assignment.instanceDueDate
      });
    }

    const { repetition, dueDate: finalDueDate } = assignment.todoId;

    let nextDueDate = null;

    /**
     * Weekly Reset
     */
    if (repetition === 'weekly') {
      nextDueDate = new Date(assignment.instanceDueDate);

      nextDueDate.setDate(nextDueDate.getDate() + 7);
    }

    /**
     * Monthly Reset
     */
    if (repetition === 'monthly') {
      nextDueDate = new Date(assignment.instanceDueDate);

      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    /**
     * Reset Recurring Task
     */
    if (nextDueDate && nextDueDate <= finalDueDate) {
      assignment.status = 'not_started';

      assignment.instanceDueDate = nextDueDate;

      assignment.startedAt = null;
      assignment.completedAt = null;

      await assignment.save();
    } else {
      /**
       * Mark as Overdue
       */
      if (assignment.status !== 'completed') {
        assignment.status = 'overdue';

        await assignment.save();
      }
    }
  }

  return {
    processedCount: assignments.length
  };
};
