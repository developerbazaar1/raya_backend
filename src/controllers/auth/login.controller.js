const {
  loginUser,
  logoutUser,
  forgotPassword,
  verifyForgotPasswordOtp,
  resendForgotPasswordOtp,
  resetPassword
} = require('../../services/auth.service');

const login = async (req, res) => {
  const { message, data } = await loginUser(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Login successfully',
    data
  });
};

const forgotPasswordController = async (req, res) => {
  const data = await forgotPassword(req.body);
  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully for password reset.',
    data
  });
};

const logout = async (req, res) => {
  const data = await logoutUser({
    userId: req.user.userId,
    deviceToken: req.body.deviceToken
  });

  res.status(200).json({
    status: 'success',
    message: 'Logout successful.',
    data
  });
};

const verifyForgotPasswordOtpController = async (req, res) => {
  const data = await verifyForgotPasswordOtp(req.body);
  res.status(200).json({
    status: 'success',
    message: 'OTP verified successfully.',
    data
  });
};

const resendForgotPasswordOtpController = async (req, res) => {
  const data = await resendForgotPasswordOtp(req.body);
  res.status(200).json({
    status: 'success',
    message: 'OTP resent successfully.',
    data
  });
};

const resetPasswordController = async (req, res) => {
  const data = await resetPassword(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully.',
    data
  });
};

module.exports = {
  login,
  logout,
  forgotPasswordController,
  verifyForgotPasswordOtpController,
  resendForgotPasswordOtpController,
  resetPasswordController
};
