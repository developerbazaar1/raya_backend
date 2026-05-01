const mongoose = require('mongoose');

const TEMPLATE_STATUSES = ['draft', 'active', 'archived'];

const emailTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    htmlBody: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: TEMPLATE_STATUSES,
      default: 'draft',
      index: true,
    },
    updatedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
