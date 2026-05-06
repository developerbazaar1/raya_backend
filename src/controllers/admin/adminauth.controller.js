const {
  adminLoginService,
  resendOtpService,
  verifyOtpService,
  forgotPasswordService,
  resetPasswordService,
  logoutService
} = require('../../services/admin/adminauth.service');

exports.login = async (req, res) => {
  const data = await adminLoginService(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Login successfully',
    data
  });
};

exports.verifyOtp = async (req, res) => {
  const data = await verifyOtpService(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Otp verify successfully',
    data
  });
};

exports.resendOtp = async (req, res) => {
  const data = await resendOtpService(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Otp resend successfully',
    data
  });
};

exports.forgotPassword = async (req, res) => {
  const data = await forgotPasswordService(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Otp sent successfully',
    data
  });
};

exports.resetPassword = async (req, res) => {
  const data = await resetPasswordService(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
    data
  });
};

exports.logout = async (req, res) => {
  const data = await logoutService(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Logout successfully',
    data
  });
};
