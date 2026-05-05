const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
  authenticate,
  uploadBusinessOwnerStep8Files,
  uploadEmployeeProfileStep1Files,
  validate
} = require('../../middlewares');
const {
  registerStartValidation,
  verifyOtpValidation,
  emailOnlyValidation,
  businessOwnerStepValidation,
  loginValidation,
  logoutValidation,
  forgotPasswordValidation,
  forgotPasswordOtpValidation,
  resetPasswordValidation,
  employeeProfileStepValidation
} = require('../../validations/auth.validator');

const {
  registerStart,
  resendOtp,
  verifyOtp,
  step3,
  step4,
  step5,
  step6,
  step7,
  step8
} = require('../../controllers/businessOwner/register.controller');
const {
  employeeProfileStep1,
  employeeProfileStep2
} = require('../../controllers/businessOwnerTeam/employeeProfile.controller');

const {
  login,
  logout,
  forgotPasswordController,
  verifyForgotPasswordOtpController,
  resendForgotPasswordOtpController,
  resetPasswordController
} = require('../../controllers/auth/login.controller');

router.post('/register/start', validate(registerStartValidation), asyncHandler(registerStart));
router.post('/register/resend-otp', validate(emailOnlyValidation), asyncHandler(resendOtp));
router.post('/register/verify-otp', validate(verifyOtpValidation), asyncHandler(verifyOtp));
router.post('/register/step-3', validate(businessOwnerStepValidation.step3), asyncHandler(step3));
router.post('/register/step-4', validate(businessOwnerStepValidation.step4), asyncHandler(step4));
router.post('/register/step-5', validate(businessOwnerStepValidation.step5), asyncHandler(step5));
router.post('/register/step-6', validate(businessOwnerStepValidation.step6), asyncHandler(step6));
router.post('/register/step-7', validate(businessOwnerStepValidation.step7), asyncHandler(step7));
router.post(
  '/register/step-8',
  uploadBusinessOwnerStep8Files,
  validate(businessOwnerStepValidation.step8),
  asyncHandler(step8)
);

router.post('/login', validate(loginValidation), asyncHandler(login));
router.post('/logout', authenticate, validate(logoutValidation), asyncHandler(logout));

router.post(
  '/employee/profile/step-1',
  uploadEmployeeProfileStep1Files,
  validate(employeeProfileStepValidation.step1),
  asyncHandler(employeeProfileStep1)
);
router.post(
  '/employee/profile/step-2',
  validate(employeeProfileStepValidation.step2),
  asyncHandler(employeeProfileStep2)
);

router.post(
  '/forgot-password',
  validate(forgotPasswordValidation),
  asyncHandler(forgotPasswordController)
);
router.post(
  '/forgot-password/verify-otp',
  validate(forgotPasswordOtpValidation),
  asyncHandler(verifyForgotPasswordOtpController)
);
router.post(
  '/forgot-password/resend-otp',
  validate(forgotPasswordValidation),
  asyncHandler(resendForgotPasswordOtpController)
);
router.post(
  '/forgot-password/reset-password',
  validate(resetPasswordValidation),
  asyncHandler(resetPasswordController)
);


module.exports = router;
