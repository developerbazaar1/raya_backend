/**
 * QUIZ ATTEMPT
 */
const mongoose = require('mongoose');
const quizAttemptSchema = new mongoose.Schema(
  {
    trainingVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingVersion',
      index: true
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      index: true
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        },
        selectedOptionIndex: Number
      }
    ],

    score: Number,
    total: Number,

    passed: Boolean,

    attemptNumber: Number
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, quizId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
