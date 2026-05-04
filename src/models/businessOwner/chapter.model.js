/**
 * CHAPTER (VERSION BASED)
 */
const mongoose = require('mongoose');
const chapterSchema = new mongoose.Schema({
    trainingVersionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingVersion',
        index: true
    },

    title: String,
    objective: String,

    sections: [
        {
            heading: String,
            content: String,
            order: Number
        }
    ],

    summary: String,
    estimatedTime: Number,

    order: Number

}, { timestamps: true });

chapterSchema.index({ trainingVersionId: 1, order: 1 });


module.exports = mongoose.model('Chapter', chapterSchema);