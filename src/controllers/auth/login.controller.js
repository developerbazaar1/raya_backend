const { loginUser } = require('../../services/auth.service');

const login = async (req, res) => {
  const { message, data } = await loginUser(req.body);
  res.status(200).json({
    status: 'success',
    message,
    data
  });
};

module.exports = { login };
