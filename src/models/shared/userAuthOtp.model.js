const mongoose = require('mongoose');
const { OTP_EXPIRY , OTP_PURPOSES } = require('../../config/constant');

const userAuthOtpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: OTP_PURPOSES,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + OTP_EXPIRY)
    },
    consumedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

userAuthOtpSchema.index(
  { userId: 1, purpose: 1, consumedAt: 1, expiresAt: 1 },
  { name: 'active_user_otp_lookup_idx' }
);

module.exports = mongoose.model('UserAuthOtp', userAuthOtpSchema);
