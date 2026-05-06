const mongoose = require('mongoose');

const adminRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    permissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminPermission'
      }
    ],
    isSystemRole: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

adminRoleSchema.index({ isActive: 1 });

module.exports = mongoose.model('AdminRole', adminRoleSchema);
