const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessOwner',
      required: true,
    },
    employeeRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeRole',
      default: null,
    },
    dateOfBirth: { type: Date },
    phoneNumber: {
      countryCode: { type: String, trim: true },
      number: { type: String, trim: true },
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
      gender: { type: String, trim: true },
    }],
    havePets: { type: Boolean, default: false },
    pets:[{
      name: { type: String, trim: true },
      age: { type: String, trim: true },
    }],
    favouriteFlower: { type: String, trim: true },
    favouriteCakeFlavour: { type: String, trim: true },
    favouriteOnlineStore: { type: String, trim: true },
    favouriteLocalBusiness: { type: String, trim: true },
    favouriteRestaurants: { type: String, trim: true },
    notification: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Employee', employeeSchema);
