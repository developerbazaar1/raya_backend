const mongoose = require('mongoose');
const { FileReferenceSchema } = require('../shared/file.schema');

const registrationStateSchema = new mongoose.Schema(
  {
    currentStep: { type: Number, default: 1, min: 1, max: 8 },
    completedSteps: [{ type: Number, min: 1, max: 8 }],
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress'
    },
    agreedToTerms: { type: Boolean, default: false },
    subscribedToMarketing: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    paymentCompleted: { type: Boolean, default: false },
    passwordCreated: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    lastCompletedAt: { type: Date, default: null }
  },
  { _id: false }
);

const businessOwnerInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    businessName: { type: String, trim: true },
    businessType: { type: String, trim: true }, // Update this admin business type later
    address: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    website: { type: String, trim: true },
    companyLogo: {
      type: FileReferenceSchema,
      default: {
        url: '',
        key: '',
        fileName: '',
        mimeType: '',
        sizeBytes: 0
      }
    },
    notification: { type: Boolean, default: false },
    timeZone: { type: String, trim: true },
    whatBringsYouThere: { type: String, trim: true },
    whatBringsYouThereOther: { type: String, trim: true },
    howDidYouHearAboutUs: { type: String, trim: true },
    howDidYouHearAboutUsOther: { type: String, trim: true },
    phoneNumber: {
      countryCode: { type: String, trim: true },
      number: { type: String, trim: true }
    },
    totalTimeOff: { type: Number, default: 15 },
    registrationState: {
      type: registrationStateSchema,
      default: () => ({})
    },
    approvalStatus: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected'],
      default: 'pending_approval'
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive'
    },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    deactivatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessOwnerInfo', businessOwnerInfoSchema);
