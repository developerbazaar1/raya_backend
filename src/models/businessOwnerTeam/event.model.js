const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    businessOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusinessOwner',
        required: true
    },
    createdByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
        trim: true,
    },
    endTime: {
        type: String,
        required: true,
        trim: true,
    },
    favorite: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);