const Employee = require('../../models/businessOwnerTeam/employeesInfo.model');
const EmployeeRole = require('../../models/businessOwner/employeeRoles.model');
const User = require('../../models/shared/users.model');
const { uploadFileToSpaces } = require('../../helper/fileUpload.helper');

const AppError = require('../../utils/appError');
const { DEFAULT_PROFILE_IMAGE } = require('../../config/constant');

const ensureBusinessOwnerTeam = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'employee') {
    throw new AppError('Business owner team not found.', 404);
  }
  let businessOwnerTeamInfo = (await Employee.findOne({ userId: user._id })) || {};

  let employeeRole = null;
  if (businessOwnerTeamInfo.employeeRoleId) {
    employeeRole = await EmployeeRole.findById(businessOwnerTeamInfo.employeeRoleId).select(
      'roleName'
    );
  }

  return { user, businessOwnerTeamInfo, employeeRole };
};

exports.getProfileService = async (userId) => {
  const { user, businessOwnerTeamInfo, employeeRole } = await ensureBusinessOwnerTeam(userId);
  return buildSettingsResponse(user, businessOwnerTeamInfo, employeeRole);
};

const buildSettingsResponse = (user, businessOwnerTeamInfo, employeeRole) => ({
  //personal details
  profilePicture: user.userProfile?.url || DEFAULT_PROFILE_IMAGE,
  name: user.name || '',
  email: user.email || '',
  department: employeeRole?.roleName || '',
  phoneNumber: businessOwnerTeamInfo.phoneNumber || ' ',
  gender: businessOwnerTeamInfo.gender || ' ',
  dateOfBirth: businessOwnerTeamInfo.dateOfBirth || ' ',
  hiringDate: businessOwnerTeamInfo.hiringDate || ' ',
  address: businessOwnerTeamInfo.address || ' ',

  // Family details
  isMarried: businessOwnerTeamInfo.isMarried || false,
  spouseName: businessOwnerTeamInfo.spouseName || ' ',
  spouseAnniversary: businessOwnerTeamInfo.spouseAnniversary || ' ',
  spouseGender: businessOwnerTeamInfo.spouseGender || ' ',
  haveKids: businessOwnerTeamInfo.haveKids || false,
  kids: businessOwnerTeamInfo.kids || [],
  havePets: businessOwnerTeamInfo.havePets || false,
  pets: businessOwnerTeamInfo.pets || [],

  //notification
  enabledPushNotification: businessOwnerTeamInfo.notification || false,
  //application preference
  timeZone: businessOwnerTeamInfo.timeZone || '',
  //favourite
  favouriteFlower: businessOwnerTeamInfo.favouriteFlower || '',
  favouriteCakeFlavour: businessOwnerTeamInfo.favouriteCakeFlavour || '',
  favouriteOnlineStore: businessOwnerTeamInfo.favouriteOnlineStore || '',
  favouriteLocalBusiness: businessOwnerTeamInfo.favouriteLocalBusiness || '',
  favouriteRestaurants: businessOwnerTeamInfo.favouriteRestaurants || ''
});

exports.updateProfileService = async (userId, payload) => {
  const { user, businessOwnerTeamInfo, employeeRole } = await ensureBusinessOwnerTeam(userId);
  const files = payload.files || {};
  const profilePictureFile = files.profilePicture?.[0];

  if (profilePictureFile) {
    const profilePictureMetadata = await uploadFileToSpaces(
      profilePictureFile,
      `business-owner-team/${user._id}/settings/profile-picture`
    );
    if (profilePictureMetadata) {
      user.userProfile = profilePictureMetadata;
    }
  }

  if (payload.name !== undefined) {
    user.name = payload.name;
  }

  if (payload.phoneNumberCountryCode !== undefined || payload.phoneNumber !== undefined) {
    businessOwnerTeamInfo.phoneNumber = {
      ...businessOwnerTeamInfo.phoneNumber?.toObject?.(),
      ...businessOwnerTeamInfo.phoneNumber,
      ...(payload.phoneNumberCountryCode !== undefined
        ? { countryCode: payload.phoneNumberCountryCode }
        : {}),
      ...(payload.phoneNumber !== undefined ? { number: payload.phoneNumber } : {})
    };
  }

  if (payload.gender !== undefined) {
    businessOwnerTeamInfo.gender = payload.gender;
  }

  if (payload.dateOfBirth !== undefined) {
    businessOwnerTeamInfo.dateOfBirth = payload.dateOfBirth;
  }

  if (payload.hiringDate !== undefined) {
    businessOwnerTeamInfo.hiringDate = payload.hiringDate;
  }

  if (payload.address !== undefined) {
    businessOwnerTeamInfo.address = payload.address;
  }

  if (payload.timeZone !== undefined) {
    businessOwnerTeamInfo.timeZone = payload.timeZone;
  }

  if (payload.enabledPushNotification !== undefined) {
    businessOwnerTeamInfo.notification = payload.enabledPushNotification;
  }

  if (payload.favouriteFlower !== undefined) {
    businessOwnerTeamInfo.favouriteFlower = payload.favouriteFlower;
  }
  if (payload.favouriteCakeFlavour !== undefined) {
    businessOwnerTeamInfo.favouriteCakeFlavour = payload.favouriteCakeFlavour;
  }
  if (payload.favouriteOnlineStore !== undefined) {
    businessOwnerTeamInfo.favouriteOnlineStore = payload.favouriteOnlineStore;
  }
  if (payload.favouriteLocalBusiness !== undefined) {
    businessOwnerTeamInfo.favouriteLocalBusiness = payload.favouriteLocalBusiness;
  }
  if (payload.favouriteRestaurants !== undefined) {
    businessOwnerTeamInfo.favouriteRestaurants = payload.favouriteRestaurants;
  }

  await user.save();
  await businessOwnerTeamInfo.save();

  return buildSettingsResponse(user, businessOwnerTeamInfo, employeeRole);
};
