const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate } = require('../../middlewares');
const { adminLoginValidation, resendOtpValidation, verifyOtpValidation, forgotPasswordValidation, resetPasswordValidation } = require('../../validations/admin/adminauth.validator');
const { login, resendOtp, verifyOtp, forgotPassword, resetPassword, logout } = require('../../controllers/admin/adminauth.controller');


router.post('/login', validate(adminLoginValidation), asyncHandler(login));
router.post('/resend-otp', validate(resendOtpValidation), asyncHandler(resendOtp));
router.post('/verify-otp', validate(verifyOtpValidation), asyncHandler(verifyOtp));
router.post('/forgot-password', validate(forgotPasswordValidation), asyncHandler(forgotPassword));
router.post('/reset-password', validate(resetPasswordValidation), asyncHandler(resetPassword));
router.post('/logout', asyncHandler(logout));


module.exports = router;
