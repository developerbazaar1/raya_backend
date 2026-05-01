const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
    {
        businessOwnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
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
            maxlength: 150,
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
        invitedMembers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },],
    },
    { timestamps: true },
);

module.exports = mongoose.model('Meeting', meetingSchema);
