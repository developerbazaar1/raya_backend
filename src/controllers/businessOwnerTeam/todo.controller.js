const {
  getAllTodo,
  updateStatus,
  getTodoHistory
} = require('../../services/businessOwnerTeam/todo.service');

exports.allTodo = async (req, res) => {
  const data = await getAllTodo(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Todo list fetched successfully',
    data
  });
};

exports.updateStatus = async (req, res) => {
  const data = await updateStatus(req.params.todoAssignmentId, req.body, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'Todo status updated successfully',
    data
  });
};

exports.getHistory = async (req, res) => {
  const data = await getTodoHistory(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Todo history fetched successfully',
    data
  });
};
