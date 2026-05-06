/**
 * CHAPTER PROGRESS
 */
const mongoose = require('mongoose');
const { CHAPTER_PROGRESS_STATUS } = require('../../config/constant');
const chapterProgressSchema = new mongoose.Schema({
  trainingVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingVersion'
  },

  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  status: {
    type: String,
    enum:  CHAPTER_PROGRESS_STATUS,
    default: 'not_started'
  },

  completedAt: Date

}, { timestamps: true });

chapterProgressSchema.index(
  { chapterId: 1, userId: 1 },
  { unique: true }
);


module.exports = mongoose.model('ChapterProgress', chapterProgressSchema);
