const TodoAssignment = require('../../models/businessOwnerTeam/todoAssignment.model');
const TodoHistory = require('../../models/businessOwnerTeam/todoHistory.model');
const Todo = require('../../models/businessOwner/todo.model');


exports.getAllTodo = async (userId, query) => {
    const { page = 1, limit = 10 } = query;
    const pageNo = Math.max(1, parseInt(page));
    const limitNo = Math.max(1, parseInt(limit));
    const skip = (pageNo - 1) * limitNo;

    const filter = {
        userId: userId,
        status: { $nin: ['completed', 'overdue'] }
    };

    const [todoAssignments, total] = await Promise.all([
        TodoAssignment.find(filter)
            .populate('todoId', 'name dueDate repetition ')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNo),
        TodoAssignment.countDocuments(filter)
    ]);

    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();

    const formattedTodos = todoAssignments.map((todoAssignment) => {
        const instanceDate = new Date(todoAssignment.instanceDueDate || todoAssignment.todoId?.dueDate);
        const isToday = instanceDate.toDateString() === todayStr;

        return {
            id: todoAssignment._id,
            status: todoAssignment.status || 'not_started',
            name: todoAssignment.todoId?.name || '',
            dueDate: instanceDate,
            repetition: todoAssignment.todoId?.repetition || '',
            isToday: isToday,
            createdAt: todoAssignment.createdAt || ''
        };
    });
    return {
        items: formattedTodos,
        pagination: {
            total,
            page: pageNo,
            limit: limitNo,
            totalPages: Math.ceil(total / limitNo)
        }
    };
};


exports.updateStatus = async (todoAssignmentId, body, userId) => {
    const { status } = body;

    const todoAssignment = await TodoAssignment.findById(todoAssignmentId).populate('todoId');
    if (!todoAssignment) {
        throw new Error('Todo assignment not found');
    }
    if (todoAssignment.userId.toString() !== userId.toString()) {
        throw new Error('You are not authorized to update this todo assignment');
    }

    const now = new Date();

    // Update timestamps based on status
    if (status === 'in_progress' && !todoAssignment.startedAt) {
        todoAssignment.startedAt = now;
    } else if (status === 'completed' && !todoAssignment.completedAt) {
        todoAssignment.completedAt = now;
    }

    todoAssignment.status = status;
    await todoAssignment.save();

    // Log to History if completed
    if (status === 'completed') {
        await TodoHistory.create({
            todoId: todoAssignment.todoId._id,
            userId: todoAssignment.userId,
            status: 'completed',
            dueDate: todoAssignment.instanceDueDate || todoAssignment.todoId.dueDate,
            completedAt: now
        });
    }

    // Check if task was overdue at the time of update
    const isOverdue = todoAssignment.todoId?.dueDate && new Date(todoAssignment.todoId.dueDate) < now;

    return {
        ...todoAssignment.toObject(),
        isOverdue: !!(isOverdue && status !== 'completed'),
        todoId: {
            _id: todoAssignment.todoId?._id,
            name: todoAssignment.todoId?.name,
            dueDate: todoAssignment.todoId?.dueDate
        }
    };
};

exports.getTodoHistory = async (userId, query) => {
    const { page = 1, limit = 10 } = query;
    const pageNo = Math.max(1, parseInt(page));
    const limitNo = Math.max(1, parseInt(limit));
    const skip = (pageNo - 1) * limitNo;

    const filter = { userId: userId };

    const [history, total] = await Promise.all([
        TodoHistory.find(filter)
            .populate('todoId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNo),
        TodoHistory.countDocuments(filter)
    ]);

    const formattedHistory = history.map(item => ({
        id: item._id,
        todoId: item.todoId?._id,
        name: item.todoId?.name || '',
        status: item.status,
        dueDate: item.dueDate,
        completedAt: item.completedAt,
        createdAt: item.createdAt
    }));

    return {
        items: formattedHistory,
        pagination: {
            total,
            page: pageNo,
            limit: limitNo,
            totalPages: Math.ceil(total / limitNo)
        }
    };
};

/**
 * Background process logic (to be called by Cron)
 * Handles Overdue logging and Recurring Resets
 */
exports.processTodoResets = async () => {
    const now = new Date();

    // 1. Find all active assignments where instanceDueDate has passed
    const assignments = await TodoAssignment.find({
        instanceDueDate: { $lt: now },
        status: { $in: ['not_started', 'in_progress'] }
    }).populate('todoId');

    for (const assignment of assignments) {
        // Log to History if not already logged as completed
        if (assignment.status !== 'completed') {
            await TodoHistory.create({
                todoId: assignment.todoId._id,
                userId: assignment.userId,
                status: 'overdue',
                dueDate: assignment.instanceDueDate
            });
        }

        const { repetition, dueDate: finalDueDate } = assignment.todoId;

        // Check if we should reset for next cycle
        let nextDueDate = null;

        // ONLY Weekly (and Monthly) tasks get extended. 
        // Daily and One-time tasks will NOT get a next due date and will be removed.
        if (repetition === 'weekly') {
            nextDueDate = new Date(assignment.instanceDueDate);
            nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (repetition === 'monthly') {
            nextDueDate = new Date(assignment.instanceDueDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        // If it's a valid recurring task and hasn't passed the final deadline, reset it
        if (nextDueDate && nextDueDate <= finalDueDate) {
            assignment.status = 'not_started';
            assignment.instanceDueDate = nextDueDate;
            assignment.startedAt = null;
            assignment.completedAt = null;
            await assignment.save();
        } else {
            // Instead of deleting the assignment, keep it and update status to overdue
            if (assignment.status !== 'completed') {
                assignment.status = 'overdue';
                await assignment.save();
            }
        }
    }

    return { processedCount: assignments.length };
};