/**
 * BusinessFoundation model
 * ----------------
 * - Created by employer
 * - Represents the foundational elements of a business, including mission, vision, and values
 */
const mongoose = require('mongoose');

const businessFoundationSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mission: { type: String, trim: true },
    vision: { type: String, trim: true },
    values: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessFoundation', businessFoundationSchema);
