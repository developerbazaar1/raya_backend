const {
  todoCreateService,
  todoAllService,
  updateTodoService,
  ceoToDoListService
} = require('../../services/todo.service');

exports.todoCreate = async (req, res) => {
  const data = await todoCreateService(req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'To-Do item created successfully',
    data
  });
};
exports.todoAll = async (req, res) => {
  const result = await todoAllService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'To-Do items retrieved successfully',
    ...result
  });
};

exports.updateTodo = async (req, res) => {
  const todo = await updateTodoService(req.params.todoId, req.body, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'To-Do item updated successfully',
    data: todo
  });
};


exports.ceoToDoList = async (req, res) => {
  const result = await ceoToDoListService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'To-Do items retrieved successfully',
    ...result
  });
};