const AppError = require('../../utils/appError');
const { createAuthToken, comparePassword, createOtp, hashValue, hashPassword } = require('../../helper/auth.helper');
const AdminUser = require('../../models/admin/adminUser.model');
const AdminAuthOtp = require('../../models/admin/adminAuthOtp.model');
const VERIFICATION_OTP_PURPOSE = 'email_verification';

//admin login
const adminLoginService = async (body) => {
  const { email, password } = body;


  const admin = await AdminUser.findOne({ email });
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  if (admin.status !== 'active') {
    throw new AppError(`Your account is ${admin.status}`, 403);
  }

  const isPasswordValid = await comparePassword(password, admin.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid password', 401);
  }

  //create token for admin
  const token = createAuthToken(admin);

  //create otp for admin
  const otp = createOtp();
  await AdminAuthOtp.create({
    adminUserId: admin._id,
    email: admin.email,
    otpHash: hashValue(otp),
    purpose: VERIFICATION_OTP_PURPOSE
  });

  return {
    token,
    otp,
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role
    }
  };
};

//verify otp
const verifyOtpService = async (body) => {

  const { email, otp } = body;
  const adminAuthOtp = await AdminAuthOtp.findOne({
    email,
    purpose: VERIFICATION_OTP_PURPOSE
  }).sort({ createdAt: -1 });


  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }


  const isOtpValid = hashValue(otp) === adminAuthOtp.otpHash;
  if (!isOtpValid) {
    throw new AppError('Invalid otp', 401);
  }
  return adminAuthOtp;
};

//resend-otp
const resendOtpService = async (body) => {
  const { email } = body;
  const adminAuthOtp = await AdminAuthOtp.findOne({
    email,
    purpose: VERIFICATION_OTP_PURPOSE
  }).sort({ createdAt: -1 });

  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }

  const otp = createOtp();
  await AdminAuthOtp.create({
    adminUserId: adminAuthOtp.adminUserId,
    email: adminAuthOtp.email,
    otpHash: hashValue(otp),
    purpose: VERIFICATION_OTP_PURPOSE
  });
  return {
    otp,
    admin: {
      id: adminAuthOtp.adminUserId,
      email: adminAuthOtp.email,
      role: adminAuthOtp.role
    }
  };
};

//forgot password
const forgotPasswordService = async (body) => {

  const { email } = body;
  const adminAuthOtp = await AdminAuthOtp.findOne({
    email,
    purpose: VERIFICATION_OTP_PURPOSE
  }).sort({ createdAt: -1 });

  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }

  const otp = createOtp();
  await AdminAuthOtp.create({
    adminUserId: adminAuthOtp.adminUserId,
    email: adminAuthOtp.email,
    otpHash: hashValue(otp),
    purpose: VERIFICATION_OTP_PURPOSE
  });
  return {
    otp,
    admin: {
      id: adminAuthOtp.adminUserId,
      email: adminAuthOtp.email,
      role: adminAuthOtp.role
    }
  };
};


//reset password
const resetPasswordService = async (body) => {
  const { email, newPassword, confirmPassword } = body;
  const adminAuthOtp = await AdminAuthOtp.findOne({
    email,
    purpose: VERIFICATION_OTP_PURPOSE
  }).sort({ createdAt: -1 });


  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const admin = await AdminUser.findByIdAndUpdate(
    adminAuthOtp.adminUserId,
    {
      password: await hashPassword(newPassword),
      passwordChangedAt: new Date()
    },

    { new: true }
  );
  return admin;
};


//logout
const logoutService = async (body) => {
  const { adminUserId } = body;
  const adminAuthOtp = await AdminAuthOtp.findOne({
    adminUserId,
    purpose: VERIFICATION_OTP_PURPOSE
  }).sort({ createdAt: -1 });

  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }

  const otp = createOtp();
  await AdminAuthOtp.create({
    adminUserId: adminAuthOtp.adminUserId,
    email: adminAuthOtp.email,
    otpHash: hashValue(otp),
    purpose: VERIFICATION_OTP_PURPOSE
  });
  return {
    otp,
    admin: {
      id: adminAuthOtp.adminUserId,
      email: adminAuthOtp.email,
      role: adminAuthOtp.role
    }
  };
};
module.exports = {
  adminLoginService,
  verifyOtpService,
  resendOtpService,
  forgotPasswordService,
  resetPasswordService,
  logoutService
};
