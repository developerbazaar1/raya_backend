const mongoose = require('mongoose');
const { TIME_OFF_STATUS } = require('../../config/constant');

const timeOfRequestActionSchema = new mongoose.Schema({
    timeOffRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimeOffRequest',
        required: true
    },
    action: {
        type: String,
        enum: TIME_OFF_STATUS,
        required: true
    },
    oldDates: {
        startDate: { type: Date },
        endDate: { type: Date }
    },
    newDates: {
        startDate: { type: Date },
        endDate: { type: Date }
    },

    comment: {
        type: String,
        maxlength: 255
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('TimeOfRequestAction', timeOfRequestActionSchema);