const {
  saveEmployeeProfileStep1,
  saveEmployeeProfileStep2
} = require('../../services/auth.service');

const employeeProfileStep1 = async (req, res) => {
  const data = await saveEmployeeProfileStep1({
    userId: req.user.userId,
    ...req.body,
    files: req.files || {}
  });

  res.status(200).json({
    status: 'success',
    message: 'Employee profile step 1 completed successfully.',
    data
  });
};

const employeeProfileStep2 = async (req, res) => {
  const data = await saveEmployeeProfileStep2({
    userId: req.user.userId,
    ...req.body
  });

  res.status(200).json({
    status: 'success',
    message: 'Employee profile completed successfully.',
    data
  });
};

module.exports = {
  employeeProfileStep1,
  employeeProfileStep2
};
