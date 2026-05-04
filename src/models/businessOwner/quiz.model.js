/**
 * QUIZ (PER CHAPTER)
 */
const mongoose = require('mongoose');
const quizSchema = new mongoose.Schema({
  trainingVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingVersion',
    index: true
  },

  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    index: true
  },

  title: String

}, { timestamps: true }); 

module.exports = mongoose.model('Quiz', quizSchema);