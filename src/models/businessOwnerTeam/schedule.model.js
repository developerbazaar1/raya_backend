const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../../config/constant');

const scheduleSchema = new mongoose.Schema({
    businessOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
    },
    contractorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contractor',
    },
    date: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: SCHEDULE_STATUS
    }
}, { timestamps: true });


module.exports = mongoose.model('Schedule', scheduleSchema);
