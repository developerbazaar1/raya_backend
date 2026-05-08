const { taskCreateService, getTaskByIdService } = require('../../services/task.service');

exports.taskCreate = async (req, res) => {
  const data = await taskCreateService(req.body, req.files, req.user.userId);
  res.status(201).json({
    success: 'success',
    message: 'Task created successfully',
    data
  });
};

exports.getTaskById = async (req, res) => {
  const data = await getTaskByIdService(req.params.taskId, req.user.userId, req.query);
  res.status(200).json({
    success: 'success',
    message: 'Task retrieved successfully',
    data
  });
};
