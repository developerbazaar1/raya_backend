const mongoose = require('mongoose');

const employeeProfileCompletionSchema = new mongoose.Schema(
  {
    currentStep: { type: Number, default: 1, min: 1, max: 2 },
    completedSteps: [{ type: Number, min: 1, max: 2 }],
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress'
    },
    lastCompletedAt: { type: Date, default: null }
  },
  { _id: false }
);

const employeeInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    // # Reference to the business owner (User)
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    employeeRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeRole',
      default: null
    },
    dateOfBirth: { type: Date },
    phoneNumber: {
      countryCode: { type: String, trim: true },
      number: { type: String, trim: true }
    },
    gender: { type: String, trim: true },
    hiringDate: { type: Date },
    timeZone: { type: String, trim: true },
    department: { type: String, trim: true },
    address: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    isMarried: { type: Boolean, default: false },
    spouseName: { type: String, trim: true },
    spouseAnniversary: { type: Date },
    spouseGender: { type: String, trim: true },
    haveKids: { type: Boolean, default: false },
    kids:[{
      name: { type: String, trim: true },
      birthday: { type: Date },
      gender: { type: String, trim: true }
    }],
    havePets: { type: Boolean, default: false },
    pets:[{
      name: { type: String, trim: true },
      age: { type: String, trim: true }
    }],
    favouriteFlower: { type: String, trim: true },
    favouriteCakeFlavour: { type: String, trim: true },
    favouriteOnlineStore: { type: String, trim: true },
    favouriteLocalBusiness: { type: String, trim: true },
    favouriteRestaurants: { type: String, trim: true },
    notification: { type: Boolean, default: false },
    subscribedToMarketingEmails: { type: Boolean, default: false },
    agreedToTermsAndPrivacyPolicy: { type: Boolean, default: false },
    profileCompletion: {
      type: employeeProfileCompletionSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeInfo', employeeInfoSchema);
