const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true
    },
    endTime: {
      type: String,
      // required: true,
      trim: true
    },
    favorite: {
      type: String,
      // required: true,
    },
    notes: {
      type: String,
      trim: true
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
