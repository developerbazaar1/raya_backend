const {
  startRegistration,
  resendRegistrationOtp,
  verifyRegistrationOtp,
  saveRegistrationStep3,
  saveRegistrationStep4,
  saveRegistrationStep5,
  saveRegistrationStep6,
  saveRegistrationStep7,
  saveRegistrationStep8
} = require('../../services/auth.service');

const registerStart = async (req, res) => {
  const data = await startRegistration(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Registration started. Verify OTP to continue.',
    data
  });
};

const resendOtp = async (req, res) => {
  const data = await resendRegistrationOtp(req.body);
  res.status(200).json({
    status: 'success',
    message: 'OTP resent successfully.',
    data
  });
};

const verifyOtp = async (req, res) => {
  const data = await verifyRegistrationOtp(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully.',
    data
  });
};

const step3 = async (req, res) => {
  const data = await saveRegistrationStep3(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Step 3 completed successfully.',
    data
  });
};

const step4 = async (req, res) => {
  const data = await saveRegistrationStep4(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Plan selected successfully.',
    data
  });
};

const step5 = async (req, res) => {
  const data = await saveRegistrationStep5(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Payment recorded successfully.',
    data
  });
};

const step6 = async (req, res) => {
  const data = await saveRegistrationStep6(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Step 6 completed successfully.',
    data
  });
};

const step7 = async (req, res) => {
  const data = await saveRegistrationStep7(req.body);
  res.status(200).json({
    status: 'success',
    message: 'Password set successfully.',
    data
  });
};

const step8 = async (req, res) => {
  const data = await saveRegistrationStep8({
    ...req.body,
    files: req.files || {}
  });
  res.status(200).json({
    status: 'success',
    message: 'Registration completed successfully.',
    data
  });
};

module.exports = {
  registerStart,
  resendOtp,
  verifyOtp,
  step3,
  step4,
  step5,
  step6,
  step7,
  step8
};
