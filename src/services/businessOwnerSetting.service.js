const BusinessOwnerInfo = require('../models/businessOwner/businessOwnerInfo.model');
const BusinessFoundation = require('../models/businessOwner/businessFoundation.model');
const User = require('../models/shared/users.model');
const AppError = require('../utils/appError');
const { comparePassword, hashPassword } = require('../helper/auth.helper');
const { uploadFileToSpaces } = require('../helper/fileUpload.helper');

const ensureBusinessOwner = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.role !== 'business_owner') {
    throw new AppError('Business owner not found.', 404);
  }

  let businessOwnerInfo = await BusinessOwnerInfo.findOne({ userId: user._id });

  if (!businessOwnerInfo) {
    businessOwnerInfo = await BusinessOwnerInfo.create({ userId: user._id });
  }

  return { user, businessOwnerInfo };
};

const buildSettingsResponse = (user, businessOwnerInfo) => ({
  profilePicture: user.userProfile,
  name: user.name,
  phoneNumber: businessOwnerInfo.phoneNumber,
  businessName: businessOwnerInfo.businessName,
  businessType: businessOwnerInfo.businessType,
  address: businessOwnerInfo.address,
  website: businessOwnerInfo.website,
  country: businessOwnerInfo.country,
  state: businessOwnerInfo.state,
  city: businessOwnerInfo.city,
  zipCode: businessOwnerInfo.zipCode,
  logo: businessOwnerInfo.companyLogo,
  totalTimeOff: businessOwnerInfo.totalTimeOff,
  timeZone: businessOwnerInfo.timeZone,
  enabledPushNotification: businessOwnerInfo.notification
});

const getBusinessOwnerSettings = async (userId) => {
  const { user, businessOwnerInfo } = await ensureBusinessOwner(userId);
  return buildSettingsResponse(user, businessOwnerInfo);
};

const ensureBusinessFoundation = async (userId) => {
  const { user } = await ensureBusinessOwner(userId);

  let businessFoundation = await BusinessFoundation.findOne({
    businessOwnerId: user._id
  }).select('-__v -createdAt -updatedAt');

  if (!businessFoundation) {
    businessFoundation = await BusinessFoundation.create({
      businessOwnerId: user._id
    });
  }

  return businessFoundation;
};

const getBusinessOwnerFoundation = async (userId) => {
  const businessFoundation = await ensureBusinessFoundation(userId);

  return businessFoundation;
};

const updateBusinessOwnerFoundation = async (userId, payload) => {
  const businessFoundation = await ensureBusinessFoundation(userId);

  if (payload.mission !== undefined) {
    businessFoundation.mission = payload.mission;
  }

  if (payload.vision !== undefined) {
    businessFoundation.vision = payload.vision;
  }

  if (payload.values !== undefined) {
    businessFoundation.values = payload.values;
  }

  await businessFoundation.save();

  return businessFoundation;
};

const updateBusinessOwnerSettings = async (userId, payload) => {
  const { user, businessOwnerInfo } = await ensureBusinessOwner(userId);
  const files = payload.files || {};
  const profilePictureFile = files.profilePicture?.[0];
  const logoFile = files.logo?.[0];
  const profilePictureMetadata = await uploadFileToSpaces(
    profilePictureFile,
    `business-owners/${user._id}/settings/profile-picture`
  );
  const logoMetadata = await uploadFileToSpaces(
    logoFile,
    `business-owners/${user._id}/settings/logo`
  );

  if (payload.name !== undefined) {
    user.name = payload.name;
  }

  if (profilePictureMetadata) {
    user.userProfile = profilePictureMetadata;
  }

  if (payload.phoneNumberCountryCode !== undefined || payload.phoneNumber !== undefined) {
    businessOwnerInfo.phoneNumber = {
      ...businessOwnerInfo.phoneNumber?.toObject?.(),
      ...businessOwnerInfo.phoneNumber,
      ...(payload.phoneNumberCountryCode !== undefined
        ? { countryCode: payload.phoneNumberCountryCode }
        : {}),
      ...(payload.phoneNumber !== undefined
        ? { number: payload.phoneNumber }
        : {})
    };
  }

  if (payload.businessName !== undefined) {
    businessOwnerInfo.businessName = payload.businessName;
  }

  if (payload.businessType !== undefined) {
    businessOwnerInfo.businessType = payload.businessType;
  }

  if (payload.address !== undefined) {
    businessOwnerInfo.address = payload.address;
  }

  if (payload.website !== undefined) {
    businessOwnerInfo.website = payload.website;
  }

  if (payload.country !== undefined) {
    businessOwnerInfo.country = payload.country;
  }

  if (payload.state !== undefined) {
    businessOwnerInfo.state = payload.state;
  }

  if (payload.city !== undefined) {
    businessOwnerInfo.city = payload.city;
  }

  if (payload.zipCode !== undefined) {
    businessOwnerInfo.zipCode = payload.zipCode;
  }

  if (logoMetadata) {
    businessOwnerInfo.companyLogo = logoMetadata;
  }

  if (payload.totalTimeOff !== undefined) {
    businessOwnerInfo.totalTimeOff = payload.totalTimeOff;
  }

  if (payload.timeZone !== undefined) {
    businessOwnerInfo.timeZone = payload.timeZone;
  }

  if (payload.enabledPushNotification !== undefined) {
    businessOwnerInfo.notification = payload.enabledPushNotification;
  }

  await user.save();
  await businessOwnerInfo.save();

  return buildSettingsResponse(user, businessOwnerInfo);
};

const updateBusinessOwnerPassword = async (userId, payload) => {
  const { user } = await ensureBusinessOwner(userId);
  const isCurrentPasswordValid = await comparePassword(payload.currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect.', 400);
  }

  user.password = await hashPassword(payload.newPassword);
  await user.save();

  return { updated: true };
};

module.exports = {
  getBusinessOwnerSettings,
  getBusinessOwnerFoundation,
  updateBusinessOwnerSettings,
  updateBusinessOwnerFoundation,
  updateBusinessOwnerPassword
};
