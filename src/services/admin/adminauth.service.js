const AppError = require('../../utils/appError');
const {
  createAuthToken,
  comparePassword,
  createOtp,
  hashValue,
  hashPassword
} = require('../../helper/auth.helper');
const User = require('../../models/shared/users.model');
const UserAuthOtp = require('../../models/shared/userAuthOtp.model');
const VERIFICATION_OTP_PURPOSE = 'email_verification';
const ADMIN_ROLE = 'admin';

const buildAdminResponse = (admin) => ({
  id: admin._id,
  email: admin.email,
  role: admin.role
});

const createOrRefreshAdminOtp = async (admin, purpose = VERIFICATION_OTP_PURPOSE) => {
  const otp = createOtp();

  await UserAuthOtp.updateMany(
    {
      userId: admin._id,
      purpose,
      consumedAt: null
    },
    { $set: { consumedAt: new Date() } }
  );

  await UserAuthOtp.create({
    userId: admin._id,
    email: admin.email,
    otpHash: hashValue(otp),
    purpose
  });

  return otp;
};

const getLatestAdminOtp = async (email, purpose = VERIFICATION_OTP_PURPOSE) =>
  UserAuthOtp.findOne({
    email,
    purpose
  }).sort({ createdAt: -1 });

//admin login
const adminLoginService = async (body) => {
  const { email, password } = body;

  const admin = await User.findOne({ email, role: ADMIN_ROLE });
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const isPasswordValid = await comparePassword(password, admin.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid password', 401);
  }

  //create token for admin
  const token = createAuthToken(admin);

  //create otp for admin
  const otp = await createOrRefreshAdminOtp(admin);

  return {
    token,
    otp,
    admin: buildAdminResponse(admin)
  };
};

//verify otp
const verifyOtpService = async (body) => {
  const { email, otp } = body;
  const adminAuthOtp = await getLatestAdminOtp(email);

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
  const admin = await User.findOne({ email, role: ADMIN_ROLE });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const adminAuthOtp = await getLatestAdminOtp(email);

  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }

  const otp = await createOrRefreshAdminOtp(admin);
  return {
    otp,
    admin: buildAdminResponse(admin)
  };
};

//forgot password
const forgotPasswordService = async (body) => {
  const { email } = body;
  const admin = await User.findOne({ email, role: ADMIN_ROLE });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const adminAuthOtp = await getLatestAdminOtp(email);

  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }

  const otp = await createOrRefreshAdminOtp(admin);
  return {
    otp,
    admin: buildAdminResponse(admin)
  };
};

//reset password
const resetPasswordService = async (body) => {
  const { email, newPassword, confirmPassword } = body;
  const adminAuthOtp = await getLatestAdminOtp(email);

  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const admin = await User.findOneAndUpdate(
    { _id: adminAuthOtp.userId, role: ADMIN_ROLE },
    {
      password: await hashPassword(newPassword)
    },
    { new: true }
  );

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  return admin;
};

//logout
const logoutService = async (body) => {
  const { adminUserId } = body;
  const admin = await User.findOne({ _id: adminUserId, role: ADMIN_ROLE });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const adminAuthOtp = await UserAuthOtp.findOne({
    userId: adminUserId,
    purpose: VERIFICATION_OTP_PURPOSE
  }).sort({ createdAt: -1 });

  if (!adminAuthOtp) {
    throw new AppError('Otp not found', 404);
  }

  const otp = await createOrRefreshAdminOtp(admin);
  return {
    otp,
    admin: buildAdminResponse(admin)
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
