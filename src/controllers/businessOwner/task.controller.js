const { taskCreateService } = require('../../services/task.service');

exports.taskCreate = async (req, res) => {
    const data = await taskCreateService(req.body, req.user.userId);
    res.status(201).json({
        success: "success",
        message: 'Task created successfully',
        data
    });
}
