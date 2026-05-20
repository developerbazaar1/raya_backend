// models/MentalHealthCheckin.js

const mongoose = require('mongoose');
const { MoodLabelEnum } = require('../../config/constant');

const MentalHealthCheckinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },

    moodLabel: {
      type: String,
      enum: MoodLabelEnum,
      default: 'Neutral'
    },

    note: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    tags: [
      {
        type: String,
        trim: true
      }
    ],

    isCrisis: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate mood label + crisis status
MentalHealthCheckinSchema.pre('save', function () {
  const score = this.moodScore;

  if (score <= 2) {
    this.moodLabel = 'Critical';
    this.isCrisis = true;
  } else if (score <= 4) {
    this.moodLabel = 'Struggling';
  } else if (score <= 6) {
    this.moodLabel = 'Neutral';
  } else if (score <= 8) {
    this.moodLabel = 'Good';
  } else {
    this.moodLabel = 'Excellent';
  }
});

module.exports = mongoose.model('MentalHealthCheckin', MentalHealthCheckinSchema);
