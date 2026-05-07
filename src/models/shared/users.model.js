const { FileReferenceSchema } = require('./file.schema');
const { ROLES } = require('../../config/constant');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    role: { type: String, enum: ROLES, required: true },
    userProfile: {
      type: FileReferenceSchema,
      default: {
        url: '',
        key: '',
        fileName: '',
        mimeType: '',
        sizeBytes: 0
      }
    },
    dateOfJoining: { type: Date },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deviceTokens: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

/**
 * Add device token
 */
userSchema.methods.addDeviceToken = async function (token) {
  if (!token) return this;

  if (!this.deviceTokens.includes(token)) {
    this.deviceTokens.push(token);
    await this.save();
  }

  return this;
};

/**
 * Remove device token
 */
userSchema.methods.removeDeviceToken = async function (token) {
  if (!token) return this;

  this.deviceTokens = this.deviceTokens.filter((t) => t !== token);
  await this.save();

  return this;
};

module.exports = mongoose.model('User', userSchema);
