const mongoose = require('mongoose');
const { FileReferenceSchema } = require('../schema/file.schema');

const businessOwnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
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
        sizeBytes: 0,
      },
    },
    totalTimeOff: { type: String, trim: true },
    notification: { type: Boolean, default: false },
    timeZone: { type: String, trim: true },
    whatBringsYouThere: { type: String, trim: true },
    whatBringsYouThereOther: { type: String, trim: true },
    howDidYouHearAboutUs: { type: String, trim: true },
    howDidYouHearAboutUsOther: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('BusinessOwner', businessOwnerSchema);
