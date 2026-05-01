const mongoose = require('mongoose');

const ADMIN_ACCOUNT_STATUSES = ['active', 'pending', 'suspend'];

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ADMIN_ACCOUNT_STATUSES,
      default: 'active',
      index: true,
    },
    roleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminRole',
      },
    ],
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  { timestamps: true },
);

adminUserSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model('AdminUser', adminUserSchema);
