const mongoose = require('mongoose');
const { TIME_OFF_STATUS } = require('../../config/constant');

const timeOffRequestSchema = new mongoose.Schema({
    
    // # Reference to the business owner (User)
    businessOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    reason: {
        type: String,
        maxlength: 255
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalDays: {
        type: Number
    },
    fullDay:{
        type: Boolean,
    },
    halfDay:{
        firstHalfDay: { type: Boolean },
        secondHalfDay: { type: Boolean }
    },
    status: {
        type: String,
        enum: TIME_OFF_STATUS,
        default: 'pending'
    },
    ownerComment: {
        type: String,
        maxlength: 255
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TimeOffRequest', timeOffRequestSchema);
