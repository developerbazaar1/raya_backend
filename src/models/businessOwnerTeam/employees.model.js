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
    birthDate: { type: Date },
    phoneNumber: {
     
    },
    hiringDate: { type: Date },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    gender: { type: String, trim: true },
    address: { type: String, trim: true },
    timeZone: { type: String, trim: true },
    notification: { type: Boolean, default: false },
    spouseName: { type: String, trim: true },
    spouseAnniversary: { type: Date },
    spouseGender: { type: String, trim: true },
    kidsName: { type: String, trim: true },
    kidsBirthday: { type: Date },
    kidsGender: { type: String, trim: true },
    petName: { type: String, trim: true },
    petAge: { type: String, trim: true },
    favFlowers: { type: String, trim: true },
    favCakeFlower: { type: String, trim: true },
    favOnlineStore: { type: String, trim: true },
    favLocalBusiness: { type: String, trim: true },
    favRestaurants: { type: String, trim: true },
    totalTimeOff: { type: Number, default: 15 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Employee', employeeSchema);
