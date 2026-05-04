/**
 * QUIZ QUESTIONS
 */
const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    index: true
  },

  question: String,

  options: [
    {
      text: String,
      isCorrect: Boolean
    }
  ]

}, { timestamps: true });

questionSchema.index({ quizId: 1 });

module.exports = mongoose.model('Question', questionSchema);