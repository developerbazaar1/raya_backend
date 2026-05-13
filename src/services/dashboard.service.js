const User = require('../models/shared/users.model');
const Meeting = require('../models/businessOwner/meeting.model');
const Todo = require('../models/businessOwner/todo.model');
const AppError = require('../utils/appError');

exports.dashboardService = async (body, userId) => {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Fetch data in parallel for performance
    const [totalEmployees, meetingsToday, recentTodos, topPriorities] = await Promise.all([
        User.countDocuments({ owner: userId, role: 'employee', isDeleted: false }),

        // Count meetings scheduled for today
        Meeting.countDocuments({
            businessOwnerId: userId,
            date: { $gte: startOfDay, $lte: endOfDay }
        }),

        // Fetch recent todos (e.g., last 5)
        Todo.find({ businessOwnerId: userId })
            .select('_id name description repetition dueDate')
            .sort({ createdAt: -1 })
            .limit(5),

        // Fetch Custom Top Priorities
        Todo.find({ businessOwnerId: userId, isTopPriority: true })
            .select('_id name description repetition dueDate')
            .limit(3)
    ]);

    // 3. Handle Auto-generated vs Custom Priorities
    let priorities = topPriorities;
    let priorityType = 'custom';

    if (priorities.length === 0) {
        // If no custom priorities are set, auto-generate by fetching 3 most recent todos
        priorities = await Todo.find({ businessOwnerId: userId })
            .select('_id name description repetition dueDate')
            .sort({ createdAt: -1 })
            .limit(3);
        priorityType = 'auto';
    }

    const formatTodo = (todo) => ({
        id: todo._id,
        name: todo.name || "",
        description: todo.description || "",
        repetition: todo.repetition || "",
        dueDate: todo.dueDate || ""
    });

    return {
        stats: {
            totalEmployees,
            meetingsToday
        },
        priorityType, // 'auto' or 'custom'
        topPriorities: priorities.map(formatTodo),
        recentTodos: recentTodos.map(formatTodo)
    };
};

exports.updateTopPrioritiesService = async (body, userId) => {
    const { todoIds } = body;

    if (!Array.isArray(todoIds) || todoIds.length > 3) {
        throw new AppError('You can select up to 3 priorities only', 400);
    }

    // 1. Reset all priorities for this user
    await Todo.updateMany(
        { businessOwnerId: userId, isTopPriority: true },
        { $set: { isTopPriority: false } }
    );

    // 2. Set new priorities
    if (todoIds.length > 0) {
        await Todo.updateMany(
            { _id: { $in: todoIds }, businessOwnerId: userId },
            { $set: { isTopPriority: true } }
        );
    }

    return { message: 'Priorities updated successfully' };
};
