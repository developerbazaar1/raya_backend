const User = require('../models/shared/users.model');
const UserAuthOtp = require('../models/shared/userAuthOtp.model');
const BusinessOwnerInfo = require('../models/businessOwner/businessOwnerInfo.model');
const EmployeeInfo = require('../models/businessOwnerTeam/employeesInfo.model');
const AppError = require('../utils/appError');
const {
  hashValue,
  hashPassword,
  comparePassword,
  createOtp,
  createAuthToken
} = require('../helper/auth.helper');
const { uploadFileToSpaces } = require('../helper/fileUpload.helper');

const REGISTRATION_ROLE = 'business_owner';
const EMAIL_VERIFICATION_OTP_PURPOSE = 'email_verification';
const RESET_PASSWORD_OTP_PURPOSE = 'reset_password';

const normalizeCompletedSteps = (steps = []) => [...new Set(steps)].sort((a, b) => a - b);

const createDefaultRegistrationState = () => ({
  currentStep: 1,
  completedSteps: [],
  status: 'in_progress',
  agreedToTerms: false,
  subscribedToMarketing: false,
  emailVerified: false,
  planId: null,
  paymentCompleted: false,
  passwordCreated: false,
  profileCompleted: false,
  lastCompletedAt: null
});

const createDefaultEmployeeProfileCompletion = () => ({
  currentStep: 1,
  completedSteps: [],
  status: 'in_progress',
  lastCompletedAt: null
});

const ensureBusinessOwnerUser = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (user.role !== REGISTRATION_ROLE) {
    throw new AppError('Registration is only available for business owners.', 403);
  }

  return user;
};

const ensureBusinessOwnerUserById = async (userId) => {
  const user = await User.findOne({ _id: userId, role: REGISTRATION_ROLE, isDeleted: false });
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};

const findUserByEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};

const getOrCreateBusinessOwnerInfo = async (userId) => {
  let businessOwnerInfo = await BusinessOwnerInfo.findOne({ userId });
  if (!businessOwnerInfo) {
    businessOwnerInfo = await BusinessOwnerInfo.create({
      userId,
      registrationState: createDefaultRegistrationState()
    });
  }

  if (!businessOwnerInfo.registrationState) {
    businessOwnerInfo.registrationState = createDefaultRegistrationState();
  }

  return businessOwnerInfo;
};

const getOrCreateEmployeeInfo = async (user) => {
  let employeeInfo = await EmployeeInfo.findOne({ userId: user._id });
  if (!employeeInfo) {
    employeeInfo = await EmployeeInfo.create({
      userId: user._id,
      businessOwnerId: user.owner,
      profileCompletion: createDefaultEmployeeProfileCompletion()
    });
  }

  if (!employeeInfo.profileCompletion) {
    employeeInfo.profileCompletion = createDefaultEmployeeProfileCompletion();
  }

  return employeeInfo;
};

const markStepCompleted = (businessOwnerInfo, stepNumber, nextStep) => {
  const completedSteps = normalizeCompletedSteps([
    ...(businessOwnerInfo.registrationState?.completedSteps || []),
    stepNumber
  ]);

  businessOwnerInfo.registrationState = {
    ...businessOwnerInfo.registrationState.toObject?.(),
    ...businessOwnerInfo.registrationState,
    completedSteps,
    currentStep: nextStep,
    lastCompletedAt: new Date()
  };
};

const markEmployeeStepCompleted = (employeeInfo, stepNumber, nextStep) => {
  const completedSteps = normalizeCompletedSteps([
    ...(employeeInfo.profileCompletion?.completedSteps || []),
    stepNumber
  ]);

  employeeInfo.profileCompletion = {
    ...employeeInfo.profileCompletion.toObject?.(),
    ...employeeInfo.profileCompletion,
    completedSteps,
    currentStep: nextStep,
    lastCompletedAt: new Date()
  };
};

const buildRegistrationResponse = (user, businessOwnerInfo) => ({
  userId: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  registration: {
    status: businessOwnerInfo.registrationState.status,
    currentStep: businessOwnerInfo.registrationState.currentStep,
    completedSteps: businessOwnerInfo.registrationState.completedSteps,
    emailVerified: businessOwnerInfo.registrationState.emailVerified,
    paymentCompleted: businessOwnerInfo.registrationState.paymentCompleted,
    passwordCreated: businessOwnerInfo.registrationState.passwordCreated,
    profileCompleted: businessOwnerInfo.registrationState.profileCompleted
  },
  approval: {
    approvalStatus: businessOwnerInfo.approvalStatus,
    accountStatus: businessOwnerInfo.accountStatus
  }
});

const buildEmployeeProfileResponse = (user, employeeInfo) => ({
  userId: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  employeeProfile: {
    status: employeeInfo.profileCompletion.status,
    currentStep: employeeInfo.profileCompletion.currentStep,
    completedSteps: employeeInfo.profileCompletion.completedSteps
  }
});

const ensureStepAccess = (businessOwnerInfo, expectedStep) => {
  if (businessOwnerInfo.registrationState.status === 'completed') {
    throw new AppError('Registration has already been completed.', 400);
  }

  if (businessOwnerInfo.registrationState.currentStep !== expectedStep) {
    throw new AppError(
      `Please complete step ${businessOwnerInfo.registrationState.currentStep} first.`,
      400
    );
  }
};

const ensureEmployeeStepAccess = (employeeInfo, expectedStep) => {
  if (employeeInfo.profileCompletion.status === 'completed') {
    throw new AppError('Employee profile has already been completed.', 400);
  }

  if (employeeInfo.profileCompletion.currentStep !== expectedStep) {
    throw new AppError(
      `Please complete step ${employeeInfo.profileCompletion.currentStep} first.`,
      400
    );
  }
};

const createOrRefreshOtp = async (user, purpose) => {
  const otp = createOtp();

  await UserAuthOtp.updateMany(
    {
      userId: user._id,
      purpose,
      consumedAt: null
    },
    { $set: { consumedAt: new Date() } }
  );

  await UserAuthOtp.create({
    userId: user._id,
    email: user.email,
    otpHash: hashValue(otp),
    purpose
  });

  return otp;
};

const getActiveOtpRecord = async (userId, purpose) =>
  UserAuthOtp.findOne({
    userId,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

const startRegistration = async ({ name, email, agreeToTerms, subscribeToMarketing = false }) => {
  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (user && user.role !== REGISTRATION_ROLE) {
    throw new AppError('This email is already used by another account type.', 400);
  }

  if (!user) {
    user = await User.create({
      name,
      email: normalizedEmail,
      role: REGISTRATION_ROLE
    });
  } else {
    user.name = name;
    await user.save();
  }

  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);

  if (businessOwnerInfo.registrationState.status === 'completed') {
    throw new AppError('User already registered. Please wait for admin approval or login.', 400);
  }

  businessOwnerInfo.registrationState.agreedToTerms = agreeToTerms;
  businessOwnerInfo.registrationState.subscribedToMarketing = subscribeToMarketing;
  businessOwnerInfo.registrationState.currentStep = Math.max(
    businessOwnerInfo.registrationState.currentStep || 1,
    2
  );
  businessOwnerInfo.registrationState.completedSteps = normalizeCompletedSteps([
    ...(businessOwnerInfo.registrationState.completedSteps || []),
    1
  ]);
  businessOwnerInfo.registrationState.lastCompletedAt = new Date();
  await businessOwnerInfo.save();

  const otp = await createOrRefreshOtp(user, EMAIL_VERIFICATION_OTP_PURPOSE);

  return {
    ...buildRegistrationResponse(user, businessOwnerInfo),
    otp
  };
};

const resendRegistrationOtp = async ({ email }) => {
  const user = await ensureBusinessOwnerUser(email);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);

  if (businessOwnerInfo.registrationState.emailVerified) {
    throw new AppError('Email is already verified.', 400);
  }

  const otp = await createOrRefreshOtp(user, EMAIL_VERIFICATION_OTP_PURPOSE);
  return { email: user.email, otp };
};

const verifyRegistrationOtp = async ({ email, otp }) => {
  const user = await ensureBusinessOwnerUser(email);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
  ensureStepAccess(businessOwnerInfo, 2);

  const otpRecord = await getActiveOtpRecord(user._id, EMAIL_VERIFICATION_OTP_PURPOSE);

  if (!otpRecord || otpRecord.otpHash !== hashValue(otp)) {
    throw new AppError('Invalid or expired OTP.', 400);
  }

  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  businessOwnerInfo.registrationState.emailVerified = true;
  markStepCompleted(businessOwnerInfo, 2, 3);
  await businessOwnerInfo.save();

  return {
    ...buildRegistrationResponse(user, businessOwnerInfo),
    token: createAuthToken(user)
  };
};

const forgotPassword = async ({ email }) => {
  const user = await findUserByEmail(email);

  if (!user.password) {
    throw new AppError('Password is not set for this account yet.', 400);
  }

  const otp = await createOrRefreshOtp(user, RESET_PASSWORD_OTP_PURPOSE);

  return {
    email: user.email,
    otp
  };
};

const verifyForgotPasswordOtp = async ({ email, otp }) => {
  const user = await findUserByEmail(email);
  const otpRecord = await getActiveOtpRecord(user._id, RESET_PASSWORD_OTP_PURPOSE);

  if (!otpRecord || otpRecord.otpHash !== hashValue(otp)) {
    throw new AppError('Invalid or expired OTP.', 400);
  }

  return {
    email: user.email,
    verified: true
  };
};

const resendForgotPasswordOtp = async ({ email }) => {
  const user = await findUserByEmail(email);
  const otp = await createOrRefreshOtp(user, RESET_PASSWORD_OTP_PURPOSE);

  return {
    email: user.email,
    otp
  };
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await findUserByEmail(email);
  const otpRecord = await getActiveOtpRecord(user._id, RESET_PASSWORD_OTP_PURPOSE);

  if (!otpRecord || otpRecord.otpHash !== hashValue(otp)) {
    throw new AppError('Invalid or expired OTP.', 400);
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  return {
    email: user.email,
    reset: true
  };
};

const logoutUser = async ({ userId, deviceToken }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  await user.removeDeviceToken(deviceToken);

  return {
    email: user.email,
    deviceToken,
    loggedOut: true
  };
};

const saveRegistrationStep3 = async ({ userId, whatBringsYouHere }) => {
  const user = await ensureBusinessOwnerUserById(userId);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
  ensureStepAccess(businessOwnerInfo, 3);

  businessOwnerInfo.whatBringsYouThere = whatBringsYouHere;
  markStepCompleted(businessOwnerInfo, 3, 4);
  await businessOwnerInfo.save();

  return buildRegistrationResponse(user, businessOwnerInfo);
};

const saveRegistrationStep4 = async ({ userId, planId }) => {
  const user = await ensureBusinessOwnerUserById(userId);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
  ensureStepAccess(businessOwnerInfo, 4);

  businessOwnerInfo.registrationState.planId = planId;
  markStepCompleted(businessOwnerInfo, 4, 5);
  await businessOwnerInfo.save();

  return buildRegistrationResponse(user, businessOwnerInfo);
};

const saveRegistrationStep5 = async ({ userId }) => {
  const user = await ensureBusinessOwnerUserById(userId);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
  ensureStepAccess(businessOwnerInfo, 5);

  businessOwnerInfo.registrationState.paymentCompleted = true;
  markStepCompleted(businessOwnerInfo, 5, 6);
  await businessOwnerInfo.save();

  return buildRegistrationResponse(user, businessOwnerInfo);
};

const saveRegistrationStep6 = async ({ userId, howDidYouHearAboutUs }) => {
  const user = await ensureBusinessOwnerUserById(userId);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
  ensureStepAccess(businessOwnerInfo, 6);

  businessOwnerInfo.howDidYouHearAboutUs = howDidYouHearAboutUs;
  markStepCompleted(businessOwnerInfo, 6, 7);
  await businessOwnerInfo.save();

  return buildRegistrationResponse(user, businessOwnerInfo);
};

const saveRegistrationStep7 = async ({ userId, password }) => {
  const user = await ensureBusinessOwnerUserById(userId);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
  ensureStepAccess(businessOwnerInfo, 7);

  user.password = await hashPassword(password);
  await user.save();

  businessOwnerInfo.registrationState.passwordCreated = true;
  markStepCompleted(businessOwnerInfo, 7, 8);
  await businessOwnerInfo.save();

  return buildRegistrationResponse(user, businessOwnerInfo);
};

const saveRegistrationStep8 = async ({
  userId,
  businessName,
  businessType,
  phoneNumberCountryCode,
  phoneNumber,
  timeZone,
  address,
  country,
  state,
  city,
  zipCode,
  files = {}
}) => {
  const user = await ensureBusinessOwnerUserById(userId);
  const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
  ensureStepAccess(businessOwnerInfo, 8);

  const logoFile = files.logo?.[0];
  const profilePictureFile = files.profilePicture?.[0];
  const logoMetadata = await uploadFileToSpaces(logoFile, `business-owners/${user._id}/logo`);
  const profilePictureMetadata = await uploadFileToSpaces(
    profilePictureFile,
    `business-owners/${user._id}/profile-picture`
  );

  businessOwnerInfo.businessName = businessName;
  businessOwnerInfo.businessType = businessType;
  businessOwnerInfo.address = address;
  businessOwnerInfo.country = country;
  businessOwnerInfo.state = state;
  businessOwnerInfo.city = city;
  businessOwnerInfo.zipCode = zipCode;
  businessOwnerInfo.timeZone = timeZone;
  businessOwnerInfo.phoneNumber = {
    countryCode: phoneNumberCountryCode,
    number: phoneNumber
  };

  if (logoMetadata) {
    businessOwnerInfo.companyLogo = logoMetadata;
  }

  if (profilePictureMetadata) {
    user.userProfile = profilePictureMetadata;
  }

  businessOwnerInfo.registrationState.profileCompleted = true;
  businessOwnerInfo.registrationState.status = 'completed';
  businessOwnerInfo.approvalStatus = 'pending_approval';
  businessOwnerInfo.accountStatus = 'inactive';
  markStepCompleted(businessOwnerInfo, 8, 8);
  await user.save();
  await businessOwnerInfo.save();

  return buildRegistrationResponse(user, businessOwnerInfo);
};

const loginUser = async ({ email, password, deviceToken = '' }) => {
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.role === REGISTRATION_ROLE) {
    const businessOwnerInfo = await getOrCreateBusinessOwnerInfo(user._id);
    const isRegistrationComplete = businessOwnerInfo.registrationState.status === 'completed';
    const canAuthenticateWithPassword =
      businessOwnerInfo.registrationState.emailVerified &&
      businessOwnerInfo.registrationState.passwordCreated;

    if (!canAuthenticateWithPassword) {
      return {
        message: `Registration incomplete. Continue from step ${businessOwnerInfo.registrationState.currentStep}.`,
        data: {
          ...buildRegistrationResponse(user, businessOwnerInfo),
          token: '',
          resumeRegistration: true
        }
      };
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!isRegistrationComplete) {
      return {
        message: `Registration incomplete. Continue from step ${businessOwnerInfo.registrationState.currentStep}.`,
        data: {
          ...buildRegistrationResponse(user, businessOwnerInfo),
          token: createAuthToken(user),
          resumeRegistration: true
        }
      };
    }

    if (businessOwnerInfo.approvalStatus !== 'approved') {
      throw new AppError('Your account is pending admin approval.', 403);
    }

    if (businessOwnerInfo.accountStatus !== 'active') {
      throw new AppError('Your account is deactivated. Please contact admin.', 403);
    }

    // If login is successful and device token is provided, save it to the user's record
    if (deviceToken) {
      await user.addDeviceToken(deviceToken);
    }
    return {
      message: 'Login successful.',
      data: {
        ...buildRegistrationResponse(user, businessOwnerInfo),
        token: createAuthToken(user),
        resumeRegistration: false
      }
    };
  }

  if (user.role === 'employee') {
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const employeeInfo = await getOrCreateEmployeeInfo(user);
    const isProfileComplete = employeeInfo.profileCompletion.status === 'completed';

    if (!isProfileComplete) {
      return {
        message: `Profile incomplete. Continue from step ${employeeInfo.profileCompletion.currentStep}.`,
        data: {
          ...buildEmployeeProfileResponse(user, employeeInfo),
          token: createAuthToken(user),
          resumeProfileCompletion: true
        }
      };
    }

    // If login is successful and device token is provided, save it to the user's record
    if (deviceToken) {
      await user.addDeviceToken(deviceToken);
    }
    return {
      message: 'Login successful.',
      data: {
        ...buildEmployeeProfileResponse(user, employeeInfo),
        token: createAuthToken(user),
        resumeProfileCompletion: false
      }
    };
  }

  throw new AppError('Invalid user role.', 403);
};

const saveEmployeeProfileStep1 = async ({
  userId,
  name,
  gender,
  dob,
  phoneCountryCode,
  phoneNumber,
  timeZone,
  address,
  country,
  state,
  city,
  zipCode,
  files = {}
}) => {
  const user = await User.findOne({ _id: userId, role: 'employee', isDeleted: false });
  if (!user || user.role !== 'employee') {
    throw new AppError('Employee not found.', 404);
  }

  const employeeInfo = await getOrCreateEmployeeInfo(user);
  ensureEmployeeStepAccess(employeeInfo, 1);

  const profilePhotoFile = files.profilePhoto?.[0];
  const profilePhotoMetadata = await uploadFileToSpaces(
    profilePhotoFile,
    `employees/${user._id}/profile-photo`
  );

  user.name = name;
  if (profilePhotoMetadata) {
    user.userProfile = profilePhotoMetadata;
  }
  await user.save();

  employeeInfo.gender = gender;
  employeeInfo.dateOfBirth = dob;
  employeeInfo.phoneNumber = {
    countryCode: phoneCountryCode,
    number: phoneNumber
  };
  employeeInfo.timeZone = timeZone;
  employeeInfo.address = address;
  employeeInfo.country = country;
  employeeInfo.state = state;
  employeeInfo.city = city;
  employeeInfo.zipCode = zipCode;
  markEmployeeStepCompleted(employeeInfo, 1, 2);
  await employeeInfo.save();

  return buildEmployeeProfileResponse(user, employeeInfo);
};

const saveEmployeeProfileStep2 = async ({
  userId,
  isMarried,
  spouse,
  haveKids,
  kids,
  havePets,
  pets,
  favoriteFlower,
  favoriteCackeFlavor,
  favoriteOnlineStore,
  favoriteLocalBusiness,
  favoriteRestaurant
}) => {
  const user = await User.findOne({ _id: userId, role: 'employee', isDeleted: false });
  if (!user || user.role !== 'employee') {
    throw new AppError('Employee not found.', 404);
  }

  const employeeInfo = await getOrCreateEmployeeInfo(user);
  ensureEmployeeStepAccess(employeeInfo, 2);

  employeeInfo.isMarried = isMarried;
  employeeInfo.spouseName = isMarried ? spouse?.name || '' : '';
  employeeInfo.spouseGender = isMarried ? spouse?.gender || '' : '';
  employeeInfo.spouseAnniversary = isMarried ? spouse?.anniversary || null : null;
  employeeInfo.haveKids = haveKids;
  employeeInfo.kids = haveKids
    ? (kids || []).map((kid) => ({
      name: kid.name,
      gender: kid.gender,
      birthday: kid.birthday
    }))
    : [];
  employeeInfo.havePets = havePets;
  employeeInfo.pets = havePets
    ? (pets || []).map((pet) => ({
      name: pet.name,
      age: pet.age
    }))
    : [];
  employeeInfo.favouriteFlower = favoriteFlower || '';
  employeeInfo.favouriteCakeFlavour = favoriteCackeFlavor || '';
  employeeInfo.favouriteOnlineStore = favoriteOnlineStore || '';
  employeeInfo.favouriteLocalBusiness = favoriteLocalBusiness || '';
  employeeInfo.favouriteRestaurants = favoriteRestaurant || '';
  employeeInfo.profileCompletion.status = 'completed';
  markEmployeeStepCompleted(employeeInfo, 2, 2);
  await employeeInfo.save();

  return buildEmployeeProfileResponse(user, employeeInfo);
};

module.exports = {
  startRegistration,
  resendRegistrationOtp,
  verifyRegistrationOtp,
  saveRegistrationStep3,
  saveRegistrationStep4,
  saveRegistrationStep5,
  saveRegistrationStep6,
  saveRegistrationStep7,
  saveRegistrationStep8,
  saveEmployeeProfileStep1,
  saveEmployeeProfileStep2,
  loginUser,
  logoutUser,
  forgotPassword,
  verifyForgotPasswordOtp,
  resendForgotPasswordOtp,
  resetPassword
};
