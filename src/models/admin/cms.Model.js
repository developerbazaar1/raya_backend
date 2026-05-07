const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema(
  {
    page_name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },

    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'updatedByModel'
    },
    updatedByModel: {
      type: String,
      enum: ['AdminUser', 'User']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cms', cmsSchema);
