const {
  employeeProjectListService,
  employeeTodoListService,
  employeeTodoHistoryService
} = require('../../services/admin/project.service');

//Shows the list of projects assigned to an employee
exports.employeeProjectList = async (req, res) => {
  const data = await employeeProjectListService(req.params.employeeId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Employee project list fetched successfully',
    data
  });
};

//Shows the list of to-dos assigned to an employee
exports.employeeToDoList = async (req, res) => {
  const data = await employeeTodoListService(req.params.employeeId, req.query, true);
  res.status(200).json({
    status: 'success',
    message: 'Employee to-do list fetched successfully',
    data
  });
};

//Shows the history of to-dos assigned to an employee
exports.employeeToDoHistoryList = async (req, res) => {
  const data = await employeeTodoHistoryService(req.params.employeeId, req.query, false);
  res.status(200).json({
    status: 'success',
    message: 'Employee to-do history list fetched successfully',
    data
  });
};
