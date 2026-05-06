const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    description: { type: String },
    features: [{ name: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
