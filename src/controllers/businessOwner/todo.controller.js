const { todoCreateService, todoAllService } = require('../../services/todo.service');

exports.todoCreate = async (req, res) => {
  const data = await todoCreateService(req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'To-Do item created successfully',
    data
  });
};

exports.todoAll = async (req, res) => {
  const todos = await todoAllService(req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'To-Do items retrieved successfully',
    data: todos
  });
};
